// The APIRequestData class encapsulates a set of collections, tied to an underlying DataSource
// An instance of this class survives for the life of a request

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollection = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_collection');
var OptionsSymbol = Symbol('options');
var CollectionsSymbol = Symbol('collections');

class APIRequestData {

	constructor (options) {
		this[OptionsSymbol] = options;
		this[CollectionsSymbol] = {};
	}

	makeData (callback) {
		// we'll make a local collection for each collection in the master DataSource, this collection
		// will manage the local cache that lives for the life of the request
		BoundAsync.forEachLimit(
			this,
			Object.keys(this[OptionsSymbol].api.data),
			50,
			this.addDataCollection,
			callback
		);
	}

	addDataCollection (collectionName, callback) {
		// create a DataCollection instance for this collection, this will manage our local cache
		const options = this[OptionsSymbol];
		const modelClass = this[OptionsSymbol].api.config.dataCollections[collectionName];
		let collection = new DataCollection({
			databaseCollection: options.api.data[collectionName], // the collection in the master DataSource
			modelClass: modelClass, // how to create in instance of this collection's models
			request: options.request
		});
		this[CollectionsSymbol][collectionName] = collection;
		this[collectionName] = collection;
		process.nextTick(callback);
	}

	persist (callback) {
		// persist any changes tracked in our local collections
		const collectionNames = Object.keys(this[CollectionsSymbol]);
		BoundAsync.forEachLimit(
			this,
			collectionNames,
			10,
			this.persistCollection,
			callback
		);
	}

	persistCollection (collectionName, callback) {
		if (!this[collectionName]) { return callback(); }
		this[collectionName].persist(callback);
	}
}

module.exports = APIRequestData;
