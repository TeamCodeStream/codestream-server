'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollection = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_collection');
var OptionsSymbol = Symbol('options');
var CollectionsSymbol = Symbol('collections');

class APIRequestData {

	constructor (options) {
		this[OptionsSymbol] = options;
		this[CollectionsSymbol] = {};
	}

	makeData (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this[OptionsSymbol].api.data),
			50,
			this.addDataCollection,
			callback
		);
	}

	addDataCollection (collectionName, callback) {
		const options = this[OptionsSymbol];
		const modelClass = this[OptionsSymbol].api.config.dataCollections[collectionName];
		let collection = new DataCollection({
			databaseCollection: options.api.data[collectionName],
			modelClass: modelClass,
			request: options.request
		});
		this[CollectionsSymbol][collectionName] = collection;
		this[collectionName] = collection;
		process.nextTick(callback);
	}

	persist (callback) {
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
