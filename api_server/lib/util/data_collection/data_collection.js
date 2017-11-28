'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var DataCollectionFetcher = require('./data_collection_fetcher');
var ModelOps = require('./model_ops');
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

class DataCollection {

	constructor (options) {
		this.options = options;
		this.idAttribute = this.options.idAttribute || '_id';
		this.databaseCollection = this.options.databaseCollection;
		this.modelClass = this.options.modelClass;
		if (!this.databaseCollection) {
			throw 'databaseCollection must be provided to DataCollection';
		}
		if (!this.modelClass) {
			throw 'modelClass must be provided to DataCollection';
		}
		this.requestId = this.options.request && this.options.request.id;
		this.errorHandler = new ErrorHandler(Errors);
		this.fetchOptions = {
			collection: this,
			databaseCollection: this.databaseCollection,
			modelClass: this.modelClass,
			idAttribute: this.idAttribute,
			requestId: this.requestId
		};
		this.clear();
	}

	clear () {
		this.models = {};
		this.modelOps = {};
		this.dirtyModelIds = {};
		this.toDeleteIds = {};
		this.toCreateIds = {};
		this.documentOptions = {};
	}

	getById (id, callback, options) {
		new DataCollectionFetcher(this.fetchOptions).getById(
			id,
			callback,
			options
		);
	}

	getByIds (ids, callback, options) {
		new DataCollectionFetcher(this.fetchOptions).getByIds(
			ids,
			callback,
			options
		);
	}

	getByQuery (conditions, callback, options) {
		options = options || {};
		this.databaseCollection.getByQuery(
			conditions,
			(error, documents) => {
				if (error) { return callback(error); }
				if (!options.noCache) {
					this._addDocumentsToCache(documents, callback);
				}
				else {
					callback(null, documents);
				}
			},
			Object.assign({}, options.databaseOptions, { requestId: this.requestId })
		);
	}

	getOneByQuery (conditions, callback, options) {
		options = options || {};
		this.databaseCollection.getOneByQuery(
			conditions,
			(error, document) => {
				if (error) { return callback(error); }
				let model = null;
				if (document) {
					model = this._addDataToCache(document);
				}
				return callback(null, model);
			},
			Object.assign({}, options.databaseOptions, { requestId: this.requestId })
		);
	}

	create (data, callback, options = {}) {
		let id = (data[this.idAttribute] || this.createId()).toString();
		data[this.idAttribute] = id;
		let model = new this.modelClass(data);
		this.addModelToCache(model);
		delete this.dirtyModelIds[id];
		delete this.toDeleteIds[id];
		delete this.modelOps[id];
		this.toCreateIds[id] = true;
		if (options.databaseOptions) {
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		return callback(null, model);
	}

	createId () {
		return this.databaseCollection.createId().toString();
	}

	update (data, callback, options = {}) {
		let id = data[this.idAttribute] || options.id;
		if (!id) {
			return callback(this.errorHandler.error('id', { info: this.idAttribute }));
		}
		data[this.idAttribute] = id;
		this._addDataToCache(data);
		if (!this.toCreateIds[id]) {
			this.dirtyModelIds[id] = true;
		}
		let model = this._getFromCache(id);
		if (options.databaseOptions) {
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		process.nextTick(() => {
			callback(null, model);
		});
	}

	applyOpById (id, op, callback, options = {}) {
		this._addModelOp(id, op);
		let model = this._getFromCache(id);
		if (options.databaseOptions) {
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		process.nextTick(() => {
			callback(null, model);
		});
	}

	deleteById (id, callback) {
		this._removeModelFromCache(id);
		this.toDeleteIds[id] = true;
		process.nextTick(callback);
	}

	updateDirect (query, data, callback, options = {}) {
		this.databaseCollection.updateDirect(
			query,
			data,
			callback,
			Object.assign({}, options, { requestId: this.requestId })
		);
	}

	persist (callback) {
		BoundAsync.series(this, [
			this._persistDocuments,
			this._deleteDocuments,
			this._createDocuments
		], callback);
	}

	_getFromCache (id) {
		return this.models[id];
	}

	_addDataToCache (data, callback) {
		let id = data[this.idAttribute];
		let model = this.models[id];
		if (model) {
			Object.assign(model.attributes, data);
		}
		else {
			model = new this.modelClass(data);
			this.addModelToCache(model);
		}
		if (callback) {
			return callback(null, model);
		}
		else {
			return model;
		}
	}

	_addDocumentsToCache (documents, callback) {
		let models = [];
		BoundAsync.forEachLimit(
			this,
			documents,
			50,
			(document, foreachCallback) => {
				let model = this._addDataToCache(document);
				models.push(model);
				process.nextTick(foreachCallback);
			},
			() => {
				callback(null, models);
			}
		);
	}

	addModelToCache (model, callback) {
		let id = model.id;
		let modelOps = this.modelOps[id];
		let cachedModel = this.models[id];
		if (cachedModel) {
			if (modelOps) {
				modelOps.push({ '$set': model.attributes });
			}
			else {
				Object.assign(cachedModel.attributes, model.attributes);
			}
		}
		else {
			this.models[id] = model;
		}
		return callback && process.nextTick(callback);
	}

	_addModelsToCache (models, callback) {
		BoundAsync.forEachLimit(
			this,
			models,
			50,
			this.addModelToCache,
			callback
		);
	}

	_removeModelFromCache (id) {
		delete this.models[id];
		delete this.modelOps[id];
		delete this.dirtyModelIds[id];
		delete this.toCreateIds[id];
	}

	_addModelOp (id, op) {
		let isDirty = this.dirtyModelIds[id] || this.toCreateIds[id];
		let cachedModel = this.models[id];
		if (!cachedModel) {
			this.models[id] = new this.modelClass({ [this.idAttribute]: id });
		}
		this.modelOps[id] = this.modelOps[id] || [];
		if (cachedModel && isDirty && this.modelOps[id].length === 0) {
			this.modelOps[id].push({ '$set': cachedModel.attributes });
		}
		this.modelOps[id].push(op);
		if (!this.toCreateIds[id]) {
			this.dirtyModelIds[id] = true;
		}
		ModelOps.applyOp(this.models[id], op);
	}

	_persistDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.dirtyModelIds),
			50,
			this._persistDocument,
			callback
		);
	}

	_persistDocument (id, callback) {
		let modelOps = this.modelOps[id];
		if (modelOps && modelOps.length > 0) {
			return this._persistDocumentByOps(id, modelOps, callback);
		}
		let model = this._getFromCache(id);
		if (!model) { return process.nextTick(callback); }
		model.attributes[this.idAttribute] = id;
		this.databaseCollection.update(
			model.attributes,
			(error, updatedModel) => {
				if (error) { return callback(error); }
				this.addModelToCache(updatedModel);
				delete this.modelOps[id];
				delete this.dirtyModelIds[id];
				process.nextTick(callback);
			},
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
	}

	_persistDocumentByOps (id, ops, callback) {
		this.databaseCollection.applyOpsById(
			id,
			ops,
			(error) => {
				if (error) { return callback(error); }
				delete this.modelOps[id];
				delete this.dirtyModelIds[id];
				callback();
			},
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
	}

	_createDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.toCreateIds),
			20,
			this._createDocument,
			callback
		);
	}

	_createDocument (id, callback) {
		let model = this._getFromCache(id);
		this.databaseCollection.create(
			model.attributes,
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this._addDataToCache(createdDocument);
				delete this.toCreateIds[id];
				process.nextTick(callback);
			},
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
	}

	_deleteDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.toDeleteIds),
			50,
			this._deleteDocument,
			callback
		);
	}

	_deleteDocument (id, callback) {
		this.databaseCollection.deleteById(
			id,
			(error) => {
				if (error) { return callback(error); }
				this._removeModelFromCache(id);
				delete this.toDeleteIds[id];
				process.nextTick(callback);
			},
			Object.assign({}, this.options.databaseOptions, { requestId: this.requestId })
		);
	}

	objectIdSafe (id) {
		return this.databaseCollection.objectIdSafe(id);
	}
}

module.exports = DataCollection;
