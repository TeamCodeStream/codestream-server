// Helper class for DataCollection, this handles a single fetch operation when documents
// are being fetched by ID ... we look for the models in the cache and in the database
// as needed, the caller doesn't know where they come from (and shouldn't care)

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class DataCollectionFetcher {

	constructor (options) {
		Object.assign(this, options);
		this.requestId = (this.request && this.request.id) || this.requestId;
	}

	// get a document by ID
	getById (id, callback, options) {
		// we'll just call the getByIds method here, with one element
		this.getByIds(
			[id],
			(error, models) => {
				if (error) { return callback(error); }
				let model = models.length > 0 ? models[0] : null;
				callback(null, model);
			},
			options
		);
	}

	// get several documents according to their IDs
	getByIds (ids, callback, options) {
		this.databaseOptions = Object.assign({}, options || {}, { requestId: this.requestId });	// these options go to the database layer
		this.ids = ids;
		BoundAsync.series(this, [
			this.getFromCache,		// first see what we can get from the cache
			this.fetch,				// fetch from the database what we didn't get from the cache
			this.modelize,			// turn the documents into models
			this.add				// add the models to our cache
		], (error) => {
			if (error) { return callback(error); }
			let models = (this.cachedModels || []).concat(this.fetchedModels || []);	// combine cached and fetched models to return
			callback(null, models);
		});
	}

	// get several models according to their IDs, only from the cache
	getFromCache (callback) {
		this.cachedModels = [];
		this.notFound = [];
		if (this.ids.length === 0) {
			return process.nextTick(callback);
		}
		BoundAsync.forEachLimit(
			this,
			this.ids,
			50,
			this.tryFindModel,
			callback
		);
	}

	// fetch from the database whatever models we could not get from the cache
	fetch (callback) {
		if (this.notFound.length === 0) {
			return callback();	// got 'em all from the cache ... yeehaw
		}
		else if (this.notFound.length === 1) {
			// single ID fetch is more efficient
			return this.fetchOne(callback);
		}
		else {
			return this.fetchMany(callback);
		}
	}

	// fetch just one document from the database given its ID
	fetchOne (callback) {
		this.databaseCollection.getById(
			this.notFound[0],
			(error, document) => {
				if (error) { return callback(error); }
				if (document) {
					this.fetchedDocuments = [document];
				}
				process.nextTick(callback);
			},
			this.databaseOptions
		);
	}

	// fetch several documents from the database, given their IDs
	fetchMany (callback) {
		this.databaseCollection.getByIds(
			this.notFound,
			(error, documents) => {
				if (error) { return callback(error); }
				this.fetchedDocuments = documents;
				process.nextTick(callback);
			},
			this.databaseOptions
		);
	}

	// try to find a model in the cache, given its ID
	tryFindModel (id, callback) {
		let model = this.collection._getFromCache(id);	// the DataCollection handles the cache
		if (model) {
			this.cachedModels.push(model);
		}
		else {
			this.notFound.push(id);
		}
		process.nextTick(callback);
	}

	// turn all of our fetched documents into the appropriate models for this collection
	modelize (callback) {
		this.fetchedModels = [];
		BoundAsync.forEachLimit(
			this,
			this.fetchedDocuments,
			50,
			this.modelizeDocument,
			callback
		);
	}

	// turn a single document into the appropriate model for this collection
	modelizeDocument (document, callback) {
		let model = new this.modelClass(document);
		this.fetchedModels.push(model);
		process.nextTick(callback);
	}

	// add whatever models we fetched to our cache
	add (callback) {
		// send this back to the collection class, it will handle caching
		this.collection._addModelsToCache(this.fetchedModels, callback);
	}
}

module.exports = DataCollectionFetcher;
