// mongo configuration

'use strict';

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

module.exports = {
	mongo: {
		url: MongoUrl,
		database: process.env.CS_BROADCASTER_MONGO_DATABASE
	},
	logger: {
		directory: process.env.CS_BROADCASTER_LOG_DIRECTORY,	// put log files in this directory
		basename: 'messager',								// use this for the basename of the log file
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,			// retain log files for this many milliseconds
		consoleOk: process.env.CS_BROADCASTER_LOG_CONSOLE_OK	// also output to the console
	},
	secrets: {
		api: process.env.CS_BROADCASTER_API_SECRET,
		auth: process.env.CS_BROADCASTER_AUTH_SECRET,
		subscriptionCheat: process.env.CS_BROADCASTER_SUBSCRIPTION_CHEAT_CODE	// for allowing unregistered users to subscribe to their me-channel, for testing emails
	},
	https: {
		keyfile: process.env.CS_BROADCASTER_SSL_KEYFILE,
		certfile: process.env.CS_BROADCASTER_SSL_CERTFILE,
		cafile: process.env.CS_BROADCASTER_SSL_CAFILE,
		port: process.env.CS_BROADCASTER_PORT
	},
	history: {
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,
		sweepPeriod: 60 * 60 * 1000
	}
};
