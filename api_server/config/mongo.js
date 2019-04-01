// mongo configuration

'use strict';

let MongoCfg = {};
if (process.env.CS_API_CFG_FILE) {
	MongoCfg = require(process.env.CS_API_CFG_FILE).mongo;
}
else {
	MongoCfg.database = process.env.CS_API_MONGO_DATABASE;
	MongoCfg.url = process.env.CS_API_MONGO_URL;
}
MongoCfg.hintsRequired = true;
MongoCfg.queryLogging = { // we write a separate log file for mongo queries, and for slow and "really slow" queries so we can look for problems
	basename: 'mongo-query',
	slowBasename: 'slow-mongo-query',
	slowThreshold: 100, // queries that take longer than this go to the slow query log
	reallySlowBasename: 'really-slow-mongo-query',
	reallySlowThreshold: 1000 // queries that take longer than this go to the "really slow" query log
};

module.exports = MongoCfg;
