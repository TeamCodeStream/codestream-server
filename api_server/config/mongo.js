// mongo configuration

'use strict';

const CfgData = require('./structuredCfgLoader');
const MongoCfg = CfgData.getSection('storage.mongo');
MongoCfg.database = CfgData._mongoUrlParse(MongoCfg.url).database;
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
			fields: ['providerInfo.*.*.accessToken', 'providerInfo.*.*.refreshToken', 'accessTokens.*.token', 'pubNubToken', 'broadcasterToken', 'modifiedRepos']
		},
		{
			collection: 'reviews',
			fields: ['reviewChangesets', 'reviewDiffs', 'checkpointReviewDiffs']
		}
	]
};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[mongo]:', JSON.stringify(MongoCfg, undefined, 10));
module.exports = MongoCfg;
