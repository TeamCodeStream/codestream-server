// mongo configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

/* eslint no-console: 0 */

let MongoCfg = {
	url: null,
	database: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if(CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
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

if (ShowCfg) console.log('Config[mongo]:', JSON.stringify(MongoCfg, undefined, 10));
module.exports = MongoCfg;
