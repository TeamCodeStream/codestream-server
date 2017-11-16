'use strict';

module.exports = {
	host: process.env.CS_API_MONGO_HOST,
	port: process.env.CS_API_MONGO_PORT,
	database: process.env.CS_API_MONGO_DATABASE,
	queryLogging: {
		basename: 'mongo-query',
		slowBasename: 'slow-mongo-query',
		slowThreshold: 100,
		reallySlowBasename: 'really-slow-mongo-query',
		reallySlowThreshold: 1000
	}
};
