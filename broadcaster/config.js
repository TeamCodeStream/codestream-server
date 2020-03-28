// broadcaster configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('./codestream-configs/lib/structured_config');

let CfgOpts;
if (process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE) {
	CfgOpts = { configFile: process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE };
}
else if (process.env.CSSVC_CFG_URL) {
	CfgOpts = { mongoUrl: process.env.CSSVC_CFG_URL };
}
else {
	console.log('no configuration provided. Set CSSVC_CFG_FILE or CSSVC_CFG_URL.');
	process.exit(1);
}
const CfgData = new StructuredCfgFile(CfgOpts);

let MongoCfg = CfgData.getSection('storage.mongo');
MongoCfg.database = CfgData._mongoUrlParse(MongoCfg.url).database;

let LoggerCfg = { 
	basename: 'broadcaster',								// use this for the basename of the log file
	retentionPeriod: 30 * 24 * 60 * 60 * 1000,				// retain log files for this many milliseconds
	...CfgData.getSection('broadcastEngine.codestreamBroadcaster.logger')
};

let Secrets = CfgData.getSection('broadcastEngine.codestreamBroadcaster.secrets');
Secrets.subscriptionCheat = CfgData.getProperty('sharedSecrets.subscriptionCheat');

let HttpsCfg = CfgData.getSection('ssl');
HttpsCfg.port = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.port').toString();
HttpsCfg.ignoreHttps = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.ignoreHttps');

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

if (CfgData.getSection('broadcastEngine.codestreamBroadcaster.showConfig')) {
	console.log('Config[broadcaster]:', JSON.stringify(Cfg, undefined, 10));
}

module.exports = Cfg;
