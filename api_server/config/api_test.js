// configuration for running api server unit tests

'use strict';

module.exports = {
	api: {	// where is the api server running?
		host: process.env.CS_API_HOST,
		port: process.env.CS_API_PORT
	},
	mongo: { // where is mongo running?
		host: process.env.CS_API_MONGO_HOST,
		port: process.env.CS_API_MONGO_PORT,
		database: process.env.CS_API_MONGO_DATABASE
	}
};
