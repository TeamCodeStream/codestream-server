'use strict';

var Strftime = require('strftime');
var Path = require('path');
var FS = require('fs');
var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class Simple_File_Logger {

	constructor (options) {
		if (!options.directory) {
			throw 'Simple_File_Logger needs a directory option';
		}
		if (!options.basename) {
			throw 'Simple_File_Logger needs a basename option';
		}
		Object.assign(this, options);
		if (typeof options.retention_period !== 'undefined') {
			this.retention_period = options.retention_period;
		}
		else {
			this.retention_period = this.retention_period || (7 * 24 * 60 * 60 * 1000); // one week by default
		}
		this.link_name = this.get_link_name();
	}

	initialize (callback) {
		this.started_on = Date.now();
		this.rotate(callback);
	}

	open_next_log_file (callback) {
		const now = Date.now();
		this.current_filename = this.get_log_file_name(now);
		try {
			this.fd = FS.createWriteStream(this.current_filename, { flags: 'a' });
		}
		catch (error) {
			return callback && callback(`unable to open log file ${this.current_filename}: ${error}`);
		}
		this.last_written = now;
		return callback && process.nextTick(callback);
	}

	get_log_file_name (date) {
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

	get_link_name () {
		const extension = this.extension || 'log';
		return Path.join(
			this.directory,
			this.basename + '.' + extension
		);
	}

	log (text, request_id) {
		if (!this.started_on) {
			this.initialize(() => {
				this.log_after_initialized(text, request_id);
			});
		}
		else {
			this.log_after_initialized(text, request_id);
		}
	}

	critical (text, request_id) {
		this.log('\x1b[35mCRITICAL: ' + text + '\x1b[0m', request_id);
	}

	error (text, request_id) {
		this.log('\x1b[31mERROR: ' + text + '\x1b[0m', request_id);
	}

	warn (text, request_id) {
		this.log('\x1b[33mWARNING: ' + text + '\x1b[0m', request_id);
	}

	debug (text, request_id) {
		if (this.debug_ok) {
			this.log('\x1b[36mDEBUG: ' +  text + '\x1b[0m', request_id);
		}
	}

	log_after_initialized (text, request_id) {
		this.maybe_rotate(() => {
			this.out(text, request_id);
		});
	}

	out (text, request_id) {
		let full_text = Strftime('%Y-%m-%d %H:%M:%S.%L');
		if (this.logger_host) {
			full_text += ' ' + this.logger_host;
		}
		if (this.logger_id) {
			full_text += ' ' + this.logger_id;
		}
		request_id = request_id || this.request_id;
		if (request_id) {
			full_text += ' ' + request_id;
		}
		full_text += ' ' + text;
		if (this.fd) {
			this.fd.write(full_text + '\n', 'utf8');
		}
		if (this.console_ok) {
			console.log(full_text);
		}
		this.last_written = Date.now();
	}

	maybe_rotate (callback) {
		const now = Date.now();
		const now_midnight = this.midnight(now);
		const last_written_midnight = this.midnight(this.last_written);
		if (now_midnight > last_written_midnight) {
			this.rotate(callback);
		}
		else {
			callback();
		}
	}

	midnight (timestamp) {
		const one_day = 24 * 60 * 60 * 1000;
		const ms_since_midnight_gmt = timestamp % one_day;
		const midnight_gmt = timestamp - ms_since_midnight_gmt;
		const one_minute = 60 * 1000;
		const timezone_offset = new Date().getTimezoneOffset() * one_minute;
		const my_midnight = midnight_gmt + timezone_offset - one_day;
		return my_midnight;
	}

	rotate (callback) {
		if (this.fd) {
			this.fd.end();
		}
		this.fd = null;
		this.delete_through = this.last_written;
		Bound_Async.series(this, [
			this.open_next_log_file,
			this.remove_old_link,
			this.make_new_link,
			this.cleanup_old
		], callback);
	}

	remove_old_link (callback) {
		FS.unlink(this.link_name, (error) => {
			if (error && error !== 'ENOENT') {
				console.error(`unable to unlink ${this.link_name}: ${error}`);
			}
			process.nextTick(callback);
		});
	}

	make_new_link (callback) {
		FS.link(
			this.current_filename,
			this.link_name,
			(error) => {
				if (error) {
					console.error(`unable to link ${this.link_name}: ${error}`);
				}
				process.nextTick(callback);
			}
		);
	}

	cleanup_old (callback) {
		const now = Date.now();
		const now_midnight = this.midnight(now);
		const delete_through = now_midnight - this.retention_period;
		const one_day = 24 * 60 * 60 * 1000;
		const delete_from = delete_through - 30 * one_day;
		let day = delete_from;
		Bound_Async.whilst(
			this,
			() => {
				return day <= delete_through;
			},
			(whilst_callback) => {
				this.delete_day(day, () => {
					day += one_day;
					process.nextTick(whilst_callback);
				});
			},
			callback
		);
	}

	delete_day (day, callback) {
		const filename = this.get_log_file_name(day);
		FS.unlink(filename, callback);
	}
}

module.exports = Simple_File_Logger;
