// logger configuration for inbound email server

'use strict';

module.exports = {
	directory: process.env.CS_MAILIN_LOGS,	// put log files in this directory
	basename: 'inbound-email',								// use this for the basename of the log file
	retentionPeriod: 30 * 24 * 60 * 60 * 1000,		// retain log files for this many milliseconds
	consoleOk: process.env.CS_MAILIN_LOG_CONSOLE_OK // also output to the console
};
