'use strict';

module.exports = {
	api: {
		host: process.env.CI_API_HOST,
		port: process.env.CI_API_PORT
	},
	mongo: {
		host: process.env.CI_API_MONGO_HOST,
		port: process.env.CI_API_MONGO_PORT,
		database: process.env.CI_API_MONGO_DATABASE
	}
};
