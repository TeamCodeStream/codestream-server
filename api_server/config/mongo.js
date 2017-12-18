// mongo configuration

'use strict';

module.exports = {
	host: process.env.CS_API_MONGO_HOST,
	port: process.env.CS_API_MONGO_PORT,
	database: process.env.CS_API_MONGO_DATABASE,
    url: process.env.CS_API_MONGO_URL,
	queryLogging: { // we write a separate log file for mongo queries, and for slow and "really slow" queries so we can look for problems
		basename: 'mongo-query',
		slowBasename: 'slow-mongo-query',
		slowThreshold: 100, // queries that take longer than this go to the slow query log
		reallySlowBasename: 'really-slow-mongo-query',
		reallySlowThreshold: 1000 // queries that take longer than this go to the "really slow" query log
	},
	hintsRequired: true
};
