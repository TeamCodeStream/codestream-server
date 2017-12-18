// mongo configuration

'use strict';

// mongo url can come from either a raw supplied url or from individual components,
// where authentication with user and password may or not be relevant
let MongoUrl = process.env.CS_API_MONGO_URL;
if (!MongoUrl) {
	if(process.env.CS_API_MONGO_USER) {
		MongoUrl = `mongodb://${process.env.CS_API_MONGO_USER}:${process.env.CS_API_MONGO_PASS}@${process.env.CS_API_MONGO_HOST}:${process.env.CS_API_MONGO_PORT}/${process.env.CS_API_MONGO_DATABASE}`;
	}
	else {
		MongoUrl = `mongodb://${process.env.CS_API_MONGO_HOST}:${process.env.CS_API_MONGO_PORT}/${process.env.CS_API_MONGO_DATABASE}`;
	}
}

module.exports = {
	host: process.env.CS_API_MONGO_HOST,
	port: process.env.CS_API_MONGO_PORT,
	database: process.env.CS_API_MONGO_DATABASE,
	user: process.env.CS_API_MONGO_USER,
	pass: process.env.CS_API_MONGO_PASS,
	url: MongoUrl,
	queryLogging: { // we write a separate log file for mongo queries, and for slow and "really slow" queries so we can look for problems
		basename: 'mongo-query',
		slowBasename: 'slow-mongo-query',
		slowThreshold: 100, // queries that take longer than this go to the slow query log
		reallySlowBasename: 'really-slow-mongo-query',
		reallySlowThreshold: 1000 // queries that take longer than this go to the "really slow" query log
	},
	hintsRequired: true
};
