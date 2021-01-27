#!/usr/bin/env node

// run this script to ensure the appropriate indexes are present in your mongo database,
// the api server will not run properly without these indexes in place
// you can also run this script to drop all the indexes
//
// to drop, supply "drop" as a command line argument
// to build, supply "build" as a command line argument
//
// you can supply both, that will drop and build (rebuild from scratch)

'use strict';

/* eslint no-console: 0 */

const AllModuleIndexes = {
	companies: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/companies/indexes'),
	teams: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/indexes'),
	repos: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/indexes'),
	streams: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/indexes'),
	posts: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/indexes'),
	markers: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/markers/indexes'),
	codemarks: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/indexes'),
	codemarkLinks: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/codemarks/codemark_link_indexes'),
	reviews: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/indexes'),
	users: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/indexes'),
	signupTokens: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/signup_token_indexes'),
	messages: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/indexes'),
	msteams_conversations: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/msteams_conversations/indexes'),
	msteams_states: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/msteams_states/indexes'),
	msteams_teams: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/msteams_teams/indexes'),
	reposByCommitHash: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/repos/repo_by_commit_hash_indexes'),
	gitLensUsers: require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/gitlens_user_indexes')
};

const AllFinished = {
	indexes: 0,
	drops: 0,
	indexed: 0,
	dropped: 0
};

const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const MongoClient = require('mongodb').MongoClient;

const Drop = process.argv.find(arg => arg === 'drop');
let Build = process.argv.find(arg => arg === 'build');
if(!Drop && !Build) {
	Build = 'build';
}

const DropIndexes = async function(db, collection) {
	if (!Drop) { return; }
	AllFinished.drops++;
	const collectionObj = db.collection(collection);
	try {
		await collectionObj.dropIndexes();
	}
	catch (error) {
		return console.log('error dropping indexes on collection', collection, error);
	}
	AllFinished.dropped++;
};

const BuildIndexes = async function(db, collection) {
	if (!Build) { return; }
	const moduleIndexes = AllModuleIndexes[collection];
	const collectionObj = db.collection(collection);
	for (let indexName in moduleIndexes) {
		const index = moduleIndexes[indexName];
		AllFinished.indexes++;
		console.log('ensuring index on collection', collection, index);
		try {
			await collectionObj.ensureIndex(index);
		}
		catch (error) {
			return console.log('error', error);
		}
		AllFinished.indexed++;
		console.log('indexed collection, index', collection, index);
	}
};

const DoCollection = async function(db, collection) {
	await DropIndexes(db, collection);
	await BuildIndexes(db, collection);
};

function WaitUntilFinished() {
	console.log('waiting to finish', AllFinished);
	if( (AllFinished.drops === AllFinished.dropped) && (AllFinished.indexes === AllFinished.indexed)) {
		console.log('we\'re done');
		process.exit(0);
	}
	setTimeout(WaitUntilFinished, 2000);
}

(async function() {
	let mongoClient, db;
	try {
		const mongoUrl = ApiConfig.configIsMongo()
			? ApiConfig.options.mongoUrl
			: await ApiConfig.loadPreferredConfig().storage.mongo.url;
		mongoClient = await MongoClient.connect(mongoUrl, { useNewUrlParser: true });
		db = mongoClient.db();
	}
	catch (error) {
		console.log('mongo connect error', error);
		process.exit(1);
	}
	for (let collection in AllModuleIndexes) {
		await DoCollection(db, collection);
	}
	WaitUntilFinished();
})();
