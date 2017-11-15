'use strict';

module.exports = {
	directory: process.env.CS_API_LOG_DIRECTORY,
	basename: 'api',
	retentionPeriod: 30 * 24 * 60 * 60 * 1000,
	consoleOk: process.env.CS_API_LOG_CONSOLE_OK,
	debugOk: process.env.CS_API_LOG_DEBUG
};
