// logger configuration for inbound email server

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let LoggerCfg = {};
let ShowConfig = false;

let CfgFileName = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	LoggerCfg = CfgData.getSection('inboundEmailServer.logger');
	ShowConfig = CfgData.getProperty('inboundEmailServer.showConfig');
}
else {
	LoggerCfg = {
		directory: process.env.CS_MAILIN_LOGS,	// put log files in this directory
		consoleOk: process.env.CS_INBOUND_EMAIL_LOG_CONSOLE_OK // also output to the console
	}
}
LoggerCfg.basename = 'inbound-email';	// use this for the basename of the log file
LoggerCfg.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds

if (ShowConfig) console.log('Config[logger]:', JSON.stringify(LoggerCfg, undefined, 10));
module.exports = LoggerCfg;
