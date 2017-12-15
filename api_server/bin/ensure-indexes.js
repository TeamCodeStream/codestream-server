#!/usr/bin/env node

// run this script to ensure the appropriate indexes are present in your mongo database,
// the api server will not run properly without these indexes in place
// you can also run this script to drop all the indexes
//
// to drop, supply "drop" as a command line argument
// to build, supply "build" as a command line argument
//
// you can supply both, that will drop and build (rebuild from scratch)

var Process = require('child_process');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

var AllModuleIndexes = {
	repos: require(process.env.CS_API_TOP + '/services/api/modules/repos/indexes.js'),
	streams: require(process.env.CS_API_TOP + '/services/api/modules/streams/indexes.js'),
	posts: require(process.env.CS_API_TOP + '/services/api/modules/posts/indexes.js'),
	markers: require(process.env.CS_API_TOP + '/services/api/modules/markers/indexes.js'),
	users: require(process.env.CS_API_TOP + '/services/api/modules/users/indexes.js')
};

let Drop = process.argv.find(arg => arg === 'drop');
let Build = process.argv.find(arg => arg === 'build');

var DropIndexes = function(collection, callback) {
	if (!Drop) { return callback(); }
	let command = `mongo codestream --eval "db.${collection}.dropIndexes();"`;
	console.log(command);
	Process.exec(command);
	setTimeout(callback, 1000);
};

var BuildIndexes = function(collection, callback) {
	if (!Build) { return callback(); }
	let moduleIndexes = AllModuleIndexes[collection];
	Object.keys(moduleIndexes).forEach(indexName => {
		let index = moduleIndexes[indexName];
		let command = `mongo codestream --eval "db.${collection}.ensureIndex(${JSON.stringify(index)});"`;
		console.log(command);
		Process.exec(command);
	});
	callback();
};

var DoCollection = function(collection, callback) {
	BoundAsync.series(this, [
		(seriesCallback) => {
			DropIndexes(collection, seriesCallback);
		},
		(seriesCallback) => {
			BuildIndexes(collection, seriesCallback);
		}
	], callback);
};

BoundAsync.forEachSeries(
	this,
	Object.keys(AllModuleIndexes),
	DoCollection,
	() => {
		process.exit();
	}
);
