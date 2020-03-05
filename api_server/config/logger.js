// logger configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const LoggerCfg = CfgData.getSection('apiServer.logger');
LoggerCfg.globalProperties = {
	environment: CfgData.getProperty('sharedGeneral.runTimeEnvironment'),
	service: 'api',
};
LoggerCfg.basename = 'api';                             // basename of the log file
LoggerCfg.retentionPeriod = 30 * 24 * 60 * 60 * 1000;   // retain log files for this many milliseconds

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[logger]:', JSON.stringify(LoggerCfg, undefined, 10));
module.exports = LoggerCfg;
