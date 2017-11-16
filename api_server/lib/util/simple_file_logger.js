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
		if (typeof options.retentionPeriod !== 'undefined') {
			this.retentionPeriod = options.retentionPeriod;
		}
		else {
			this.retentionPeriod = this.retentionPeriod || (7 * 24 * 60 * 60 * 1000); // one week by default
		}
		this.linkName = this.getLinkName();
	}

	initialize (callback) {
		this.startedOn = Date.now();
		this.rotate(callback);
	}

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

	getLinkName () {
		const extension = this.extension || 'log';
		return Path.join(
			this.directory,
			this.basename + '.' + extension
		);
	}

	log (text, requestId) {
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

	logAfterInitialized (text, requestId) {
		this.maybeRotate(() => {
			this.out(text, requestId);
		});
	}

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
			console.log(fullText);
		}
		this.lastWritten = Date.now();
	}

	maybeRotate (callback) {
		const now = Date.now();
		const nowMidnight = this.midnight(now);
		const lastWrittenMidnight = this.midnight(this.lastWritten);
		if (nowMidnight > lastWrittenMidnight) {
			this.rotate(callback);
		}
		else {
			callback();
		}
	}

	midnight (timestamp) {
		const oneDay = 24 * 60 * 60 * 1000;
		const msSinceMidnightGmt = timestamp % oneDay;
		const midnightGmt = timestamp - msSinceMidnightGmt;
		const oneMinute = 60 * 1000;
		const timezoneOffset = new Date().getTimezoneOffset() * oneMinute;
		const myMidnight = midnightGmt + timezoneOffset - oneDay;
		return myMidnight;
	}

	rotate (callback) {
		if (this.fd) {
			this.fd.end();
		}
		this.fd = null;
		this.deleteThrough = this.lastWritten;
		BoundAsync.series(this, [
			this.openNextLogFile,
			this.removeOldLink,
			this.makeNewLink,
			this.cleanupOld
		], callback);
	}

	removeOldLink (callback) {
		FS.unlink(this.linkName, (error) => {
			if (error && error !== 'ENOENT') {
				console.error(`unable to unlink ${this.linkName}: ${error}`);
			}
			process.nextTick(callback);
		});
	}

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

	deleteDay (day, callback) {
		const filename = this.getLogFileName(day);
		FS.unlink(filename, callback);
	}
}

module.exports = SimpleFileLogger;
