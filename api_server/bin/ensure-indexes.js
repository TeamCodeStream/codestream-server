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

let AllFinished = {
    indexes: 0,
    drops: 0,
    indexed: 0,
    dropped: 0
};

const ConfigDirectory = process.env.CS_API_TOP + '/config';
const MongoConfig = require(ConfigDirectory + '/mongo.js');

let MongoClient = require('mongodb').MongoClient;

let Drop = process.argv.find(arg => arg === 'drop');
let Build = process.argv.find(arg => arg === 'build');
if(!Drop && !Build) {
    Build = 'build';
}

var DropIndexes = function(db, collection, callback) {
	if (!Drop) { return callback(); }
    AllFinished.drops++;
    var collectionObj = db.collection(collection);
    collectionObj.dropIndexes((err) => {
        if(err) {
            console.log("error dropping indexes on collection", collection, err);
        }
        AllFinished.dropped++;
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
        AllFinished.indexes++;
        console.log("ensuring index on collection", collection, index);
        collectionObj.ensureIndex(index, (err) => {
            AllFinished.indexed++;
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

function WaitUntilFinished() {
    console.log("waiting to finish", AllFinished);
    if( (AllFinished.drops === AllFinished.dropped) && (AllFinished.indexes === AllFinished.indexed)) {
        console.log("we're done");
        process.exit(0);
    }
    setTimeout(WaitUntilFinished, 2000);
}

MongoClient.connect(MongoConfig.url, (err, db) => {
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
        WaitUntilFinished
    );
});
