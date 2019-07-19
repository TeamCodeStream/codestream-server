// mongo configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let MongoCfg = {
	url: null,
	database: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if(CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	MongoCfg = CfgData.getSection('storage.mongo');
	let MongoParsed = CfgData._mongoUrlParse(MongoCfg.url);
	MongoCfg.database = MongoParsed.database;
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
	reallySlowThreshold: 1000, // queries that take longer than this go to the "really slow" query log
	noLogData: [	// remove the fields below from query logging, replace with '*' 
		{
			collection: 'posts',
			fields: ['text']
		},
		{
			collection: 'codemarks',
			fields: ['text', 'title']
		},
		{
			collection: 'markers',
			fields: ['code']
		},
		{
			collection: 'users',
			fields: ['providerInfo.*.*.accessToken', 'providerInfo.*.*.refreshToken', 'accessTokens.*.token', 'pubNubToken', 'broadcasterToken']
		}
	]
};

module.exports = MongoCfg;
