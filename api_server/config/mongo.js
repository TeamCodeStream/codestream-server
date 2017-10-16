'use strict';

module.exports = {
	host: process.env.CS_API_MONGO_HOST,
	port: process.env.CS_API_MONGO_PORT,
	database: process.env.CS_API_MONGO_DATABASE,
	query_logging: {
		basename: 'mongo-query',
		slow_basename: 'slow-mongo-query',
		slow_threshold: 100,
		really_slow_basename: 'really-slow-mongo-query',
		really_slow_threshold: 1000
	}
};
