// Helper class for DataCollection, this handles a single fetch operation when documents
// are being fetched by ID ... we look for the models in the cache and in the database
// as needed, the caller doesn't know where they come from (and shouldn't care)

'use strict';

class DataCollectionFetcher {

	constructor (options) {
		Object.assign(this, options);
		this.requestId = (this.request && this.request.id) || this.requestId;
	}

	// get a document by ID
	async getById (id, options) {
		// we'll just call the getByIds method here, with one element
		const models = await this.getByIds([id], options);
		return models.length > 0 ? models[0] : null;
	}

	// get several documents according to their IDs
	async getByIds (ids, options = {}) {
		this.options = Object.assign({}, options || {}, { requestId: this.requestId });	// these options go to the database layer
		this.ids = ids;
		if (!options.ignoreCache) {
			await this.getFromCache();
		}
		else {
			this.notFound = [...ids];
		}
		await this.fetch();
		await this.modelize();
		if (!options.noCache) {
			await this.add();
		}
		const models = [...(this.cachedModels || []), ...(this.fetchedModels || [])]; // combine cached and fetched models to return
		if (this.options.sortInOrder) {
			return this.sortByIds(ids, models);
		}
		else {
			return models;
		}
	}

	// sort models according to the order given in the ids
	sortByIds (ids, models) {
		const sortedModels = [];
		for (let id of ids) {
			const model = models.find(m => m.id === id);
			if (model) {
				sortedModels.push(model);
			}
		}
		return sortedModels;
	}

	// get several models according to their IDs, only from the cache
	async getFromCache () {
		this.cachedModels = [];
		this.notFound = [];
		await Promise.all(this.ids.map(async id => {
			this.tryFindModel(id);
		}));
	}

	// fetch from the database whatever models we could not get from the cache
	async fetch () {
		if (this.notFound.length === 0) {
			return;	// got 'em all from the cache ... yeehaw
		}
		else if (this.notFound.length === 1) {
			// single ID fetch is more efficient
			return await this.fetchOne();
		}
		else {
			return await this.fetchMany();
		}
	}

	// fetch just one document from the database given its ID
	async fetchOne () {
		const document = await this.databaseCollection.getById(
			this.notFound[0],
			this.options
		);
		if (document) {
			this.fetchedDocuments = [document];
		}
	}

	// fetch several documents from the database, given their IDs
	async fetchMany () {
		const documents = await this.databaseCollection.getByIds(
			this.notFound,
			this.options
		);
		this.fetchedDocuments = documents;
	}

	// try to find a model in the cache, given its ID
	tryFindModel (id) {
		const model = this.collection._getFromCache(id);	// the DataCollection handles the cache
		if (model) {
			this.cachedModels.push(model);
			return true;
		}
		else {
			this.notFound.push(id);
			return false;
		}
	}

	// turn all of our fetched documents into the appropriate models for this collection
	async modelize () {
		this.fetchedModels = [];
		if (!this.fetchedDocuments) { return; }
		await Promise.all(this.fetchedDocuments.map(
			async document => {
				const model = new this.modelClass(document);
				this.fetchedModels.push(model);
			}
		));
	}

	// add whatever models we fetched to our cache
	async add () {
		// send this back to the collection class, it will handle caching
		await this.collection._addModelsToCache(this.fetchedModels);
	}
}

module.exports = DataCollectionFetcher;
