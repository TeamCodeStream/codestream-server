// broadcaster configuration

'use strict';

/* eslint no-console: 0 */

const structuredCfgFile = require('./codestream-configs/lib/structured_config');

let MongoCfg = {};
let LoggerCfg = {
	basename: 'broadcaster',								// use this for the basename of the log file
	retentionPeriod: 30 * 24 * 60 * 60 * 1000			// retain log files for this many milliseconds
};
let Secrets = {};
let HttpsCfg = {};
let CfgFileName = process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE;
const CfgData = new structuredCfgFile({
	schemaFile: './codestream-configs/parameters.json',
	configFile: CfgFileName
});
MongoCfg = CfgData.getSection('storage.mongo');
MongoCfg.database = CfgData._mongoUrlParse(MongoCfg.url).database;

LoggerCfg = { ...LoggerCfg, ...CfgData.getSection('broadcastEngine.codestreamBroadcaster.logger') };

Secrets = CfgData.getSection('broadcastEngine.codestreamBroadcaster.secrets');
Secrets.subscriptionCheat = CfgData.getProperty('sharedSecrets.subscriptionCheat');

HttpsCfg = CfgData.getSection('ssl');
HttpsCfg.port = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.port').toString();

const Cfg = {
	mongo: MongoCfg,
	logger: LoggerCfg,
	secrets: Secrets,
	https: HttpsCfg,
	history: {
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,
		sweepPeriod: 60 * 60 * 1000
	}
};

if (process.env.CS_BROADCASTER_SHOW_CFG) console.log('Config:', Cfg);
module.exports = Cfg;
