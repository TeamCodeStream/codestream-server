'use strict';

module.exports = {
	directory: process.env.CS_API_LOG_DIRECTORY,
	basename: 'api',
	retention_period: 30 * 24 * 60 * 60 * 1000,
	console_ok: process.env.CS_API_LOG_CONSOLE_OK,
	debug_ok: process.env.CS_API_LOG_DEBUG
};
