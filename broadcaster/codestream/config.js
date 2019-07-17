// mongo configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let MongoCfg = {};
let LoggerCfg = {
	basename: 'broadcaster',								// use this for the basename of the log file
	retentionPeriod: 30 * 24 * 60 * 60 * 1000			// retain log files for this many milliseconds
};
let Secrets = {};
let HttpsCfg = {};
let CfgFileName = process.env.CS_BROADCASTER_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({
		schemaFile: './codestream-configs/parameters.json',
		configFile: CfgFileName
	});
	MongoCfg = CfgData.getSection('storage.mongo');
	const MongoParsed = CfgData._mongoUrlParse(MongoCfg.url);
	MongoCfg.database = MongoParsed.database;

	LoggerCfg = { ...LoggerCfg, ...CfgData.getSection('broadcastEngine.codestreamBroadcaster.logger') };

	Secrets = CfgData.getSection('broadcastEngine.codestreamBroadcaster.secrets');
	Secrets.subscriptionCheat = CfgData.getProperty('sharedSecrets.subscriptionCheat');

	// HttpsCfg = { ...CfgFile.apiProtocol.https, ...{ port: CfgFile.broadcastEngine.codestreamBroadcaster.port.toString() } };
	HttpsCfg = CfgData.getSection('ssl');
	HttpsCfg.port = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.port').toString();
	console.log(HttpsCfg);
	process.exit();
}
else {
	// mongo url can come from either a raw supplied url or from individual components,
	// where authentication with user and password may or not be relevant
	let MongoUrl = process.env.CS_BROADCASTER_MONGO_URL;
	if (!MongoUrl) {
		if(process.env.CS_BROADCASTER_MONGO_USER) {
			MongoUrl = `mongodb://${process.env.CS_BROADCASTER_MONGO_USER}:${process.env.CS_BROADCASTER_MONGO_PASS}@${process.env.CS_BROADCASTER_MONGO_HOST}:${process.env.CS_BROADCASTER_MONGO_PORT}/${process.env.CS_BROADCASTER_MONGO_DATABASE}`;
		}
		else {
			MongoUrl = `mongodb://${process.env.CS_BROADCASTER_MONGO_HOST}:${process.env.CS_BROADCASTER_MONGO_PORT}/${process.env.CS_BROADCASTER_MONGO_DATABASE}`;
		}
	}
	MongoCfg.database = process.env.CS_BROADCASTER_MONGO_DATABASE;
	MongoCfg.url = MongoUrl;

	LoggerCfg.directory = process.env.CS_BROADCASTER_LOGS;	// put log files in this directory
	LoggerCfg.consoleOk = process.env.CS_BROADCASTER_LOG_CONSOLE_OK;	// also output to the console

	Secrets = {
		api: process.env.CS_BROADCASTER_API_SECRET,
		auth: process.env.CS_BROADCASTER_AUTH_SECRET,
		subscriptionCheat: process.env.CS_BROADCASTER_SUBSCRIPTION_CHEAT_CODE	// for allowing unregistered users to subscribe to their me-channel, for testing emails
	};

	HttpsCfg = {
		keyfile: process.env.CS_BROADCASTER_SSL_KEYFILE,
		certfile: process.env.CS_BROADCASTER_SSL_CERTFILE,
		cafile: process.env.CS_BROADCASTER_SSL_CAFILE,
		port: process.env.CS_BROADCASTER_PORT
	};
}


module.exports = {
	mongo: MongoCfg,
	logger: LoggerCfg,
	secrets: Secrets,
	https: HttpsCfg,
	history: {
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,
		sweepPeriod: 60 * 60 * 1000
	}
};
