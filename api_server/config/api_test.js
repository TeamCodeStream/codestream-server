'use strict';

module.exports = {
	api: {
		host: process.env.CS_API_HOST,
		port: process.env.CS_API_PORT
	},
	mongo: {
		host: process.env.CS_API_MONGO_HOST,
		port: process.env.CS_API_MONGO_PORT,
		database: process.env.CS_API_MONGO_DATABASE
	}
};
