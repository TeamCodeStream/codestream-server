// broadcaster configuration

'use strict';

/* eslint no-console: 0 */

const ServiceConfig = require('./server_utils/service_config');
const MongoUrlParser = require('./codestream-configs/lib/mongo_url_parser');

class BroadcastServerConfig extends ServiceConfig {
	constructor() {
		super({
			// only one of these should be defined
			configFile: process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE,
			mongoUrl: process.env.CSSVC_CFG_URL
		});
	}

	// creates a custom config object derived from the loaded native config
	_customizeConfig(nativeCfg) {
		const broadcasterCfg = {
			showConfig: nativeCfg.broadcastEngine.codestreamBroadcaster.showConfig,
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

	// compare this.config and this.lastConfig to determine if a restart or re-initialization is needed
	// restartRequired() {
	// 	return false; // if restart is not required, true otherwise.
	// }
}

module.exports = new BroadcastServerConfig();
