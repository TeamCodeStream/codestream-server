'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class DataCollectionFetcher {

	constructor (options) {
		Object.assign(this, options);
		this.requestId = (this.request && this.request.id) || this.requestId;
	}

	getById (id, callback, options) {
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

	getByIds (ids, callback, options) {
		this.databaseOptions = Object.assign({}, options || {}, { requestId: this.requestId });
		this.ids = ids;
		BoundAsync.series(this, [
			this.getFromCache,
			this.fetch,
			this.modelize,
			this.add
		], (error) => {
			if (error) { return callback(error); }
			let models = (this.cachedModels || []).concat(this.fetchedModels || []);
			callback(null, models);
		});
	}

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

	fetch (callback) {
		if (this.notFound.length === 0) {
			return callback();
		}
		else if (this.notFound.length === 1) {
			return this.fetchOne(callback);
		}
		else {
			return this.fetchMany(callback);
		}
	}

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

	tryFindModel (id, callback) {
		let model = this.collection._getFromCache(id);
		if (model) {
			this.cachedModels.push(model);
		}
		else {
			this.notFound.push(id);
		}
		process.nextTick(callback);
	}

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

	modelizeDocument (document, callback) {
		let model = new this.modelClass(document);
		this.fetchedModels.push(model);
		process.nextTick(callback);
	}

	add (callback) {
		this.collection._addModelsToCache(this.fetchedModels, callback);
	}
}

module.exports = DataCollectionFetcher;
