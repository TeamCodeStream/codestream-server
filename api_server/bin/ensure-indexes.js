#!/usr/bin/env node

// run this script to ensure the appropriate indexes are present in your mongo database,
// the api server will not run properly without these indexes in place
// you can also run this script to drop all the indexes
//
// to drop, supply "drop" as a command line argument
// to build, supply "build" as a command line argument
//
// you can supply both, that will drop and build (rebuild from scratch)

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

var AllModuleIndexes = {
	repos: require(process.env.CS_API_TOP + '/services/api/modules/repos/indexes.js'),
	streams: require(process.env.CS_API_TOP + '/services/api/modules/streams/indexes.js'),
	posts: require(process.env.CS_API_TOP + '/services/api/modules/posts/indexes.js'),
	markers: require(process.env.CS_API_TOP + '/services/api/modules/markers/indexes.js'),
	users: require(process.env.CS_API_TOP + '/services/api/modules/users/indexes.js')
};

var allFinished = {
    indexes: 0,
    drops: 0,
    indexed: 0,
    dropped: 0
};

const ConfigDirectory = process.env.CS_API_TOP + '/config';
const MongoConfig = require(ConfigDirectory + '/mongo.js');

var mongoUrl = (MongoConfig.url) ? MongoConfig.url : "mongodb://" + MongoConfig.host + ":" + MongoConfig.port + "/" + MongoConfig.database;
var MongoClient = require('mongodb').MongoClient;

let Drop = process.argv.find(arg => arg === 'drop');
let Build = process.argv.find(arg => arg === 'build');

var DropIndexes = function(db, collection, callback) {
	if (!Drop) { return callback(); }
    allFinished.drops++;
    var collectionObj = db.collection(collection);
    collectionObj.dropIndexes((err) => {
        if(err) {
            console.log("error dropping indexes on collection", collection, err);
        }
        allFinished.dropped++;
    });
    console.log("dropped indexes for collection", collection);
    callback();
};

var BuildIndexes = function(db, collection, callback) {
	if (!Build) { return callback(); }
	let moduleIndexes = AllModuleIndexes[collection];
    var collectionObj = db.collection(collection);
	Object.keys(moduleIndexes).forEach(indexName => {
		let index = moduleIndexes[indexName];
        allFinished.indexes++;
        console.log("ensuring index on collection", collection, index);
        collectionObj.ensureIndex(index, (err) => {
            allFinished.indexed++;
            if(err) {
                console.log("error", err);
            }
            else {
                console.log("indexed collection, index", collection, index);
            }
        });
	});
	callback();
};

var DoCollection = function(db, collection, callback) {
	BoundAsync.series(this, [
		(seriesCallback) => {
			DropIndexes(db, collection, seriesCallback);
		},
		(seriesCallback) => {
			BuildIndexes(db, collection, seriesCallback);
		}
	], callback);
};

function waitUntilFinished() {
    console.log("waiting to finish", allFinished);
    if( (allFinished.drops === allFinished.dropped) && (allFinished.indexes === allFinished.indexed)) {
        console.log("we're done");
        process.exit(0);
    }
    setTimeout(waitUntilFinished, 2000);
}

MongoClient.connect(mongoUrl, (err, db) => {
    if(err) {
        console.log("mongo connect error", err);
        process.exit(1);
    }
    BoundAsync.forEachSeries(
    	this,
    	Object.keys(AllModuleIndexes),
    	(collection, foreachCallback) => {
            DoCollection(db, collection, foreachCallback);
        },
        waitUntilFinished
    );
});
