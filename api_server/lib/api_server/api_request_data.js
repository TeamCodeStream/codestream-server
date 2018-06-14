// The APIRequestData class encapsulates a set of collections, tied to an underlying DataSource
// An instance of this class survives for the life of a request

'use strict';

const DataCollection = require(process.env.CS_API_TOP + '/lib/util/data_collection/data_collection');
const OptionsSymbol = Symbol('options');
const CollectionsSymbol = Symbol('collections');

class APIRequestData {

	constructor (options) {
		this[OptionsSymbol] = options;
		this[CollectionsSymbol] = {};
	}

	async makeData () {
		// we'll make a local collection for each collection in the master DataSource, this collection
		// will manage the local cache that lives for the life of the request
		await Promise.all(
			Object.keys(this[OptionsSymbol].api.data).map(async collectionName => {
				await this.addDataCollection(collectionName);
			})
		);
	}

	async addDataCollection (collectionName) {
		// create a DataCollection instance for this collection, this will manage our local cache
		const options = this[OptionsSymbol];
		const modelClass = this[OptionsSymbol].api.config.dataCollections[collectionName];
		if (!modelClass) { return; }
		let collection = new DataCollection({
			databaseCollection: options.api.data[collectionName], // the collection in the master DataSource
			modelClass: modelClass, // how to create in instance of this collection's models
			request: options.request
		});
		this[CollectionsSymbol][collectionName] = collection;
		this[collectionName] = collection;
	}

	async persist () {
		// persist any changes tracked in our local collections
		const collectionNames = Object.keys(this[CollectionsSymbol]);
		await Promise.all(
			collectionNames.map(async collectionName => {
				await this.persistCollection(collectionName);
			})
		);
	}

	async persistCollection (collectionName) {
		if (this[collectionName]) {
			await this[collectionName].persist();
		}
	}
}

module.exports = APIRequestData;
