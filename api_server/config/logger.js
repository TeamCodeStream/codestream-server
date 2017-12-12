// logger configuration

'use strict';

module.exports = {
	directory: process.env.CS_API_LOG_DIRECTORY,	// put log files in this directory
	basename: 'api',								// use this for the basename of the log file
	retentionPeriod: 30 * 24 * 60 * 60 * 1000,		// retain log files for this many milliseconds
	consoleOk: process.env.CS_API_LOG_CONSOLE_OK,	// also output to the console
	debugOk: process.env.CS_API_LOG_DEBUG			// output debug messages, for special debugging
};
