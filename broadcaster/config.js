// broadcaster configuration

'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('./codestream-configs/lib/structured_config'); 
const MongoUrlParser = require('./codestream-configs/lib/mongo_url_parser');

function customConfigFunc(nativeCfg) {
	const broadcasterCfg = {
		history: {
			retentionPeriod: 30 * 24 * 60 * 60 * 1000,
			sweepPeriod: 60 * 60 * 1000
		},
		mongo: {
			...nativeCfg.storage.mongo
		},
		logger: {
			basename: 'broadcaster',						// use this for the basename of the log file
			retentionPeriod: 30 * 24 * 60 * 60 * 1000,		// retain log files for this many milliseconds
			...nativeCfg.broadcastEngine.codestreamBroadcaster.logger
		},
		secrets: {
			...nativeCfg.broadcastEngine.codestreamBroadcaster.secrets,
			subscriptionCheat: nativeCfg.sharedSecrets.subscriptionCheat
		},
		https: {
			...nativeCfg.ssl,
			port: nativeCfg.broadcastEngine.codestreamBroadcaster.port.toString(),
			ignoreHttps: nativeCfg.broadcastEngine.codestreamBroadcaster.ignoreHttps
		}
	};
	broadcasterCfg.database = MongoUrlParser(broadcasterCfg.mongo.url).database;
	return broadcasterCfg;
}

// These configurations refer to the customzed configs if a customConfig option
// is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method.
// function customRestartFunc(priorConfig, currentConfig) {
// }

module.exports = StructuredConfigFactory.create({
	configFile: process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'broadcastEngine.codestreamBroadcaster.showConfig',
	// customRestartFunc,
	customConfigFunc
});
