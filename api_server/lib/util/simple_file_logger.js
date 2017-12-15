// provides a logger class that supports a new log file every day, and automatically
// deletes log files older than a certain interval ago

'use strict';

var Strftime = require('strftime');
var Path = require('path');
var FS = require('fs');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class SimpleFileLogger {

	constructor (options) {
		if (!options.directory) {
			throw 'SimpleFileLogger needs a directory option';
		}
		if (!options.basename) {
			throw 'SimpleFileLogger needs a basename option';
		}
		Object.assign(this, options);
		// how long will these log files stick around?
		if (typeof options.retentionPeriod !== 'undefined') {
			this.retentionPeriod = options.retentionPeriod;
		}
		else {
			this.retentionPeriod = this.retentionPeriod || (7 * 24 * 60 * 60 * 1000); // one week by default
		}
		// the log files will have a date stamp associated with them, but there will
		// always be "today's" log file with no date stamp, it is a symbolic link to the log file for today
		this.linkName = this.getLinkName();
	}

	// initialize logging
	initialize (callback) {
		this.startedOn = Date.now();
		this.rotate(callback);
	}

	// open the next log file in the rotation (it must be midnight)
	openNextLogFile (callback) {
		const now = Date.now();
		this.currentFilename = this.getLogFileName(now);
		try {
			this.fd = FS.createWriteStream(this.currentFilename, { flags: 'a' });
		}
		catch (error) {
			return callback && callback(`unable to open log file ${this.currentFilename}: ${error}`);
		}
		this.lastWritten = now;
		return callback && process.nextTick(callback);
	}

	// get a log file name associated with the passed date
	getLogFileName (date) {
		if (!date) {
			date = Date.now();
		}
		if (typeof date === 'number') {
			date = new Date(date);
		}
		const format = this.format || '%Y%m%d';
		const formatted = Strftime(format, date);
		const extension = this.extension || 'log';
		return Path.join(
			this.directory,
			this.basename + '-' + formatted + '.' + extension
		);
	}

	// get the file name for "today's" log file, without a date stamp
	// this will be a symbolic link to the log file with today's date stamp
	getLinkName () {
		const extension = this.extension || 'log';
		return Path.join(
			this.directory,
			this.basename + '.' + extension
		);
	}

	// log something, with an optional request ID
	log (text, requestId) {
		// the first logged message triggers initialization
		if (!this.startedOn) {
			this.initialize(() => {
				this.logAfterInitialized(text, requestId);
			});
		}
		else {
			this.logAfterInitialized(text, requestId);
		}
	}

	critical (text, requestId) {
		this.log('\x1b[35mCRITICAL: ' + text + '\x1b[0m', requestId);
	}

	error (text, requestId) {
		this.log('\x1b[31mERROR: ' + text + '\x1b[0m', requestId);
	}

	warn (text, requestId) {
		this.log('\x1b[33mWARNING: ' + text + '\x1b[0m', requestId);
	}

	debug (text, requestId) {
		if (this.debugOk) {
			this.log('\x1b[36mDEBUG: ' +  text + '\x1b[0m', requestId);
		}
	}

	// after initialization, we're assured of a log file to write to
	logAfterInitialized (text, requestId) {
		// check if we've reached the threshold time (midnight) and rotate as needed
		this.maybeRotate(() => {
			// and now finally, we can output our text
			this.out(text, requestId);
		});
	}

	// output text to the current log file
	out (text, requestId) {
		let fullText = Strftime('%Y-%m-%d %H:%M:%S.%L');
		if (this.loggerHost) {
			fullText += ' ' + this.loggerHost;
		}
		if (this.loggerId) {
			fullText += ' ' + this.loggerId;
		}
		requestId = requestId || this.requestId;
		if (requestId) {
			fullText += ' ' + requestId;
		}
		fullText += ' ' + text;
		if (this.fd) {
			this.fd.write(fullText + '\n', 'utf8');
		}
		if (this.consoleOk) {
			// we can also output to the console
			console.log(fullText);
		}
		this.lastWritten = Date.now();
	}

	// rotate the log file to the next date, as needed
	maybeRotate (callback) {
		const now = Date.now();
		const nowMidnight = this.midnight(now);
		const lastWrittenMidnight = this.midnight(this.lastWritten);
		if (nowMidnight > lastWrittenMidnight) {
			// yep, time to rotate, we've passed midnight
			this.rotate(callback);
		}
		else {
			callback();
		}
	}

	// what is the previous timezone-aware midnight for the passed timestamp?
	midnight (timestamp) {
		const oneDay = 24 * 60 * 60 * 1000;
		const msSinceMidnightGmt = timestamp % oneDay;
		const midnightGmt = timestamp - msSinceMidnightGmt;
		const oneMinute = 60 * 1000;
		const timezoneOffset = new Date().getTimezoneOffset() * oneMinute;
		const myMidnight = midnightGmt + timezoneOffset - oneDay;
		return myMidnight;
	}

	// rotate to the next log file
	rotate (callback) {
		if (this.fd) {
			this.fd.end();
		}
		this.fd = null;
		BoundAsync.series(this, [
			this.openNextLogFile,	// open the next one
			this.removeOldLink,		// remove the link to the last one
			this.makeNewLink,		// make a link to the new one
			this.cleanupOld			// clean up and old log files
		], callback);
	}

	// remove the link from the last master log file to its date-stamped instance
	removeOldLink (callback) {
		FS.unlink(this.linkName, (error) => {
			if (error && error !== 'ENOENT') {
				console.error(`unable to unlink ${this.linkName}: ${error}`);
			}
			process.nextTick(callback);
		});
	}

	// make a symbolic link from the master (unstamped) log file to the next (stamped) log file
	makeNewLink (callback) {
		FS.link(
			this.currentFilename,
			this.linkName,
			(error) => {
				if (error) {
					console.error(`unable to link ${this.linkName}: ${error}`);
				}
				process.nextTick(callback);
			}
		);
	}

	// clean up any log files older than the retention period
	cleanupOld (callback) {
		const now = Date.now();
		const nowMidnight = this.midnight(now);
		const deleteThrough = nowMidnight - this.retentionPeriod;
		const oneDay = 24 * 60 * 60 * 1000;
		const deleteFrom = deleteThrough - 30 * oneDay;
		let day = deleteFrom;
		BoundAsync.whilst(
			this,
			() => {
				return day <= deleteThrough;
			},
			(whilstCallback) => {
				this.deleteDay(day, () => {
					day += oneDay;
					process.nextTick(whilstCallback);
				});
			},
			callback
		);
	}

	// delete the log file associated with the given day
	deleteDay (day, callback) {
		const filename = this.getLogFileName(day);
		FS.unlink(filename, callback);
	}
}

module.exports = SimpleFileLogger;
