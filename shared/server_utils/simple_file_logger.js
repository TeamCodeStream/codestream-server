// provides a logger class that supports a new log file every day, and automatically
// deletes log files older than a certain interval ago

'use strict';

const Strftime = require('strftime');
const Path = require('path');
const FS = require('fs');
const { callbackWrap } = require('./await_utils');

class SimpleFileLogger {

	constructor (options) {
		if (!options.directory) {
			throw 'SimpleFileLogger needs a directory option';
		}
		if (!options.basename) {
			throw 'SimpleFileLogger needs a basename option';
		}
		if (options.debugOk && options.consoleOk) {
			console.log('new SimpleFileLogger(options)', options);
		}

		Object.assign(this, options);

		// allow changing log state dynically with an environment variable
		this.logJson = options.logJsonToo || process.env.SIMPLE_FILE_LOGGER_JSON_TOO || false;

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

		// what is my timezone offset? we'll assume it never changes 
		this.timezoneOffset = new Date().getTimezoneOffset() * 60 * 1000;
	}

	setLoggerId (loggerId) {
		this.loggerId = loggerId;
	}

	// initialize logging
	async initialize () {
		this.startedOn = Date.now();
		await this.rotate();
	}

	// open the next log file in the rotation (it must be midnight)
	async openNextLogFile () {
		const now = Date.now();
		this.currentFilename = this.getLogFileName(now);
		try {
			this.fd = FS.createWriteStream(this.currentFilename, { flags: 'a' });
		}
		catch (error) {
			throw `unable to open log file ${this.currentFilename}: ${error}`;
		}
		if (this.logJson) {
			try {
				this.fdJson = FS.createWriteStream(this.currentFilename + '.json', { flags: 'a' });
			}
			catch (error) {
				throw `unable to open log file ${this.currentFilename}.json: ${error}`;
			}
		}
		this.lastWritten = now;
	}

	// get a log file name associated with the passed date
	getLogFileName (timestamp) {
		if (!timestamp) {
			timestamp = Date.now();
		}
		timestamp += this.timezoneOffset;
		const date = new Date(timestamp);
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

	_severityFormat(text, severity) {
		// pretty colors...
		if (severity == 'critial') {
			return '\x1b[35mCRITICAL: ' + text + '\x1b[0m';
		}
		if (severity == 'error') {
			return '\x1b[31mERROR: ' + text + '\x1b[0m';
		}
		if (severity == 'warn') {
			return '\x1b[33mWARNING: ' + text + '\x1b[0m';
		}
		if (severity == 'debug') {
			return '\x1b[36mDEBUG: ' + text + '\x1b[0m';
		}
		// ...or not
		return text;
	}

	// log something, with an optional request ID, severity (default is 'info')
	// and custom log properties for json log format only
	async log (text, requestId, severity, customLogProperties) {
		// the first logged message triggers initialization
		if (!this.startedOn) {
			await this.initialize();
			this.logAfterInitialized(text, requestId, severity, customLogProperties);
		}
		else {
			this.logAfterInitialized(text, requestId, severity, customLogProperties);
		}
	}

	critical(text, requestId, customLogProperties) {
		this.log(text, requestId, 'critical', customLogProperties);
	}

	error(text, requestId, customLogProperties) {
		this.log(text, requestId, 'error', customLogProperties);
	}

	warn(text, requestId, customLogProperties) {
		this.log(text, requestId, 'warn', customLogProperties);
	}

	debug(text, requestId, customLogProperties) {
		if (this.debugOk) {
			this.log(text, requestId, 'debug', customLogProperties);
		}
	}

	info(text, requestId, customLogProperties) {
		this.log(text, requestId, 'info', customLogProperties);
	}

	// after initialization, we're assured of a log file to write to
	async logAfterInitialized(text, requestId, severity, customLogProperties) {
		// check if we've reached the threshold time (midnight) and rotate as needed
		await this.maybeRotate();
		// and now finally, we can output our text
		this.out(text, requestId, severity, customLogProperties);
	}

	// output text to the current log file(s)
	out(unformattedText, requestId, severity = 'info', customLogProperties = {}) {
		const now = Date.now() + this.timezoneOffset;
		const date = new Date(now);
		let fullText = Strftime('%Y-%m-%d %H:%M:%S.%LZ', date);
		const text = this._severityFormat(unformattedText, severity);
		if (!requestId) {
			requestId = this.requestId;
		}
		const defaultLogProperties = {
			service: this.basename,
			datetime: fullText,
			severity: severity,
			requestId: requestId,
			loggerId: this.loggerId,
			text: unformattedText
		};
		if (this.loggerId) {
			fullText += ' ' + this.loggerId;
		}
		if (requestId) {
			fullText += ' ' + requestId;
		}
		fullText += ' ' + text;
		if (this.fd) {
			this.fd.write(fullText + '\n', 'utf8');
		}
		if (this.consoleOk) {
			// we can also output to the console
			console.log(fullText); // eslint-disable-line no-console
			if (Object.keys(customLogProperties).length) {
				console.log(customLogProperties);
			}
		}
		if (this.fdJson) {
			// write our json log record
			let logData = {
				...defaultLogProperties,
				...this.globalLogProperties
			};
			if (Object.keys(customLogProperties).length) {
				logData.customData = JSON.stringify(customLogProperties);
			}
			// this sort only supports a flat structure; all values are scalars; no nested data.
			// https://stackoverflow.com/questions/16167581/sort-object-properties-and-json-stringify
			this.fdJson.write(JSON.stringify(logData, Object.keys(logData).sort()) + '\n', 'utf8');
		}
		this.lastWritten = Date.now();
	}

	// rotate the log file to the next date, as needed
	async maybeRotate () {
		const now = Date.now();
		const nowMidnight = this.midnight(now);
		const lastWrittenMidnight = this.midnight(this.lastWritten);
		if (nowMidnight > lastWrittenMidnight) {
			// yep, time to rotate, we've passed midnight
			await this.rotate();
		}
	}

	// what is the previous timezone-aware midnight for the passed timestamp?
	midnight (timestamp) {
		const oneDay = 24 * 60 * 60 * 1000;
		const msSinceMidnightGmt = timestamp % oneDay;
		return timestamp - msSinceMidnightGmt;
	}

	// rotate to the next log file
	async rotate () {
		if (this.fd) {
			this.fd.end();
		}
		if (this.fdJson) {
			this.fdJson.end();
		}
		this.fd = null;
		if (this.logJson) {
			this.fdJson = null;
		}
		await this.openNextLogFile(); 	// open the next one
		await this.removeOldLink();		// remove the link to the last one
		await this.makeNewLink();		// make a link to the new one
		await this.cleanupOld();		// clean up and old log files
	}

	// remove the link from the last master log file to its date-stamped instance
	async removeOldLink () {
		try {
			await callbackWrap(
				FS.unlink,
				this.linkName
			);
			if (this.logJson) {
				await callbackWrap(
					FS.unlink,
					this.linkName + '.json'
				);
			}
		}
		catch (error) {
			if (error.code !== 'ENOENT') {
				console.error(`unable to unlink ${this.linkName}: ${error}`); // eslint-disable-line no-console
			}
		}
	}

	// make a symbolic link from the master (unstamped) log file to the next (stamped) log file
	async makeNewLink () {
		try {
			await callbackWrap(
				FS.link,
				this.currentFilename,
				this.linkName
			);
			if (this.logJson) {
				await callbackWrap(
					FS.link,
					this.currentFilename + '.json',
					this.linkName + '.json'
				);
			}
		}
		catch (error) {
			if (error.code !== 'EEXIST') {
				console.error(`unable to link ${this.linkName}: ${error}`); // eslint-disable-line no-console
			}
		}
	}

	// clean up any log files older than the retention period
	async cleanupOld () {
		const now = Date.now();
		const nowMidnight = this.midnight(now);
		const deleteThrough = nowMidnight - this.retentionPeriod;
		const oneDay = 24 * 60 * 60 * 1000;
		const deleteFrom = deleteThrough - 30 * oneDay;
		let day = deleteFrom;
		while (day <= deleteThrough) {
			await this.deleteDay(day);
			day += oneDay;
		}
	}

	// delete the log file associated with the given day
	async deleteDay (day) {
		const filename = this.getLogFileName(day);
		try {
			await callbackWrap(FS.unlink, filename);
			if (this.logJson) {
				await callbackWrap(FS.unlink, filename + '.json');
			}
		}
		catch (error) {
			if (error.code !== 'ENOENT') {
				console.error(`unable to unlink ${this.linkName}: ${error}`); // eslint-disable-line no-console
			}
		}
	}
}

module.exports = SimpleFileLogger;
