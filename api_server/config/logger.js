// logger configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let LoggerCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	LoggerCfg = CfgData.getSection('apiServer.logger');
}
else {
	LoggerCfg.directory = process.env.CS_API_LOGS;            // put log files in this directory
	LoggerCfg.consoleOk = process.env.CS_API_LOG_CONSOLE_OK;  // also output to the console
	LoggerCfg.debugOk = process.env.CS_API_LOG_DEBUG;         // output debug messages, for special debugging
}

LoggerCfg.basename = 'api';                                   // use this for the basename of the log file
LoggerCfg.retentionPeriod = 30 * 24 * 60 * 60 * 1000;         // retain log files for this many milliseconds

if (ShowCfg) console.log('Config[logger]:', JSON.stringify(LoggerCfg, undefined, 10));
module.exports = LoggerCfg;
