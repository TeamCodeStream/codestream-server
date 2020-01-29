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
	companies: require(process.env.CS_API_TOP + '/modules/companies/indexes'),
	teams: require(process.env.CS_API_TOP + '/modules/teams/indexes'),
	repos: require(process.env.CS_API_TOP + '/modules/repos/indexes'),
	streams: require(process.env.CS_API_TOP + '/modules/streams/indexes'),
	posts: require(process.env.CS_API_TOP + '/modules/posts/indexes'),
	markers: require(process.env.CS_API_TOP + '/modules/markers/indexes'),
	codemarks: require(process.env.CS_API_TOP + '/modules/codemarks/indexes'),
	codemarkLinks: require(process.env.CS_API_TOP + '/modules/codemarks/codemark_link_indexes'),
	reviews: require(process.env.CS_API_TOP + '/modules/reviews/indexes'),
	users: require(process.env.CS_API_TOP + '/modules/users/indexes'),
	signupTokens: require(process.env.CS_API_TOP + '/modules/users/signup_token_indexes'),
	versionMatrix: require(process.env.CS_API_TOP + '/modules/versioner/indexes'),
	messages: require(process.env.CS_API_TOP + '/modules/broadcaster/indexes'),
	msteams_conversations: require(process.env.CS_API_TOP + '/modules/msteams_conversations/indexes'),
};

const AllFinished = {
	indexes: 0,
	drops: 0,
	indexed: 0,
	dropped: 0
};

const ConfigDirectory = process.env.CS_API_TOP + '/config';
const MongoConfig = require(ConfigDirectory + '/mongo.js');

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
		mongoClient = await MongoClient.connect(MongoConfig.url, { useNewUrlParser: true });
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
