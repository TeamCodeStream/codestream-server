// See README in this directory ... The DataCollection class offers an abstraction layer
// above the layer of a collection that actually fetches data from a database

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var DataCollectionFetcher = require('./data_collection_fetcher');
var ModelOps = require('./model_ops');
var ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');

class DataCollection {

	constructor (options) {
		this.options = options;
		this.idAttribute = this.options.idAttribute || '_id';		// our ID attribute
		this.databaseCollection = this.options.databaseCollection;	// our database collection
		this.modelClass = this.options.modelClass;					// class to use when turning documents into models
		if (!this.databaseCollection) {
			throw 'databaseCollection must be provided to DataCollection';
		}
		if (!this.modelClass) {
			throw 'modelClass must be provided to DataCollection';
		}
		this.requestId = this.options.request && this.options.request.id;	// ID of the request, for logging database fetches
		this.errorHandler = new ErrorHandler(Errors);						// handles any errors that come up
		this.fetchOptions = {										// provide these options to all fetch operations
			collection: this,
			databaseCollection: this.databaseCollection,
			modelClass: this.modelClass,
			idAttribute: this.idAttribute,
			requestId: this.requestId
		};
		this.clear();	// initialize our cache and other things
	}

	// clear our cache and associated data
	clear () {
		this.models = {};				// cached models
		this.modelOps = {};				// cached operations to perform on models
		this.dirtyModelIds = {};		// models that have been updated
		this.toDeleteIds = {};			// models that should be deleted when we persist
		this.toCreateIds = {};			// models that should be created when we persist
		this.documentOptions = {};		// database options associated with documents being persisted
	}

	// get a single model by ID
	getById (id, callback, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		new DataCollectionFetcher(this.fetchOptions).getById(
			id,
			callback,
			options
		);
	}

	// get several models by ID
	getByIds (ids, callback, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		new DataCollectionFetcher(this.fetchOptions).getByIds(
			ids,
			callback,
			options
		);
	}

	// get models by a direct database query (which is specific to the underlying database)
	// NOTA BENE: this query is passed directly on to the database layer, no attempt is made to parse the
	// query and fetch documents from the cache ... this creates the potential for a conflict between
	// models that are cached and documents in the database ... care should be taken to recognize this
	// caveat
	getByQuery (conditions, callback, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
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

	// get the first single model we find matching a direct database query ... see the note from
	// getByQuery above ... the same caveat applies here
	getOneByQuery (conditions, callback, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
		this.databaseCollection.getOneByQuery(
			conditions,
			(error, document) => {
				if (error) { return callback(error); }
				let model = null;
				if (document && !options.noCache) {
					model = this._addDataToCache(document);
				}
				return callback(null, model);
			},
			Object.assign({}, options.databaseOptions, { requestId: this.requestId })
		);
	}

	// create a model using the data passed in
	create (data, callback, options = {}) {
		// the ID can be provided or we'll generate one
		let id = (data[this.idAttribute] || this.createId()).toString();
		data[this.idAttribute] = id;
		let model = new this.modelClass(data);
		this.addModelToCache(model);
		// if we're creating a model, it pretty much obviates anything else we've done to it
		delete this.dirtyModelIds[id];
		delete this.toDeleteIds[id];
		delete this.modelOps[id];
		this.toCreateIds[id] = true;
		if (options.databaseOptions) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		return callback(null, model);
	}

	// generate an ID for a new model
	createId () {
		// we'll get it directly from the database collection
		return this.databaseCollection.createId().toString();
	}

	// update a model
	update (data, callback, options = {}) {
		let id = data[this.idAttribute] || options.id;
		if (!id) {
			// we must have an ID for it, either in options or in the attributes
			return callback(this.errorHandler.error('id', { info: this.idAttribute }));
		}
		data[this.idAttribute] = id;
		// update the data for this document in our cache
		this._addDataToCache(data);
		if (!this.toCreateIds[id]) {
			// only mark it as dirty (needs persisting) if we didn't create it, since the create will happen in a single go anyway
			this.dirtyModelIds[id] = true;
		}
		// fetch it whole from our cache, so we can return something to the caller
		let model = this._getFromCache(id);
		if (options.databaseOptions) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		process.nextTick(() => {
			callback(null, model);
		});
	}

	// apply an op (directive) to a model
	applyOpById (id, op, callback, options = {}) {
		// ops just get added to an ordered array of them, to be executed in order at persist time
		this._addModelOp(id, op);
		// get the model from the cache so we have something to return to the caller
		let model = this._getFromCache(id);
		if (options.databaseOptions) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		process.nextTick(() => {
			callback(null, model);
		});
	}

	// delete a model by ID
	deleteById (id, callback) {
		// remove it from our cache
		this._removeModelFromCache(id);
		// mark it for actual deletion when we persist
		this.toDeleteIds[id] = true;
		process.nextTick(callback);
	}

	// perform a direct update operation, this essentially passes through to the database layer,
	// no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	updateDirect (query, data, callback, options = {}) {
		this.databaseCollection.updateDirect(
			query,
			data,
			callback,
			Object.assign({}, options, { requestId: this.requestId })
		);
	}

	// perform a direct find-and-modify operation against the database
	// find-and-modify performs an operation on a document but also returns the document in
	// its original state (before the operation) ... it is an atomic operation so can be used
	// to protect against race conditions
	// there is no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	findAndModify (query, data, callback, options = {}) {
		this.databaseCollection.findAndModify(
			query,
			data,
			(error, result) => {
				if (error) { return callback(error); }
				result.value._id = result.value._id.toString();
				return callback(null, result.value);
			},
			Object.assign({}, options, { requestId: this.requestId })
		);
	}

	// persist all our recorded changes to the database ... a momentous occasion!
	persist (callback) {
		BoundAsync.series(this, [
			this._persistDocuments,	// persist document updates
			this._deleteDocuments,	// delete any documents requested
			this._createDocuments	// create any documents requested
		], callback);
	}

	// get a model from the cache by ID
	_getFromCache (id) {
		return this.models[id];
	}

	// add data a single model in the cache, which many be new data or it may overwrite existing data
	_addDataToCache (data, callback) {
		let id = data[this.idAttribute];
		let model = this.models[id];
		if (model) {
			// have a model already, assign attributes as needed
			Object.assign(model.attributes, data);
		}
		else {
			// a new model
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

	// add a series of documents to the cache, which many be new data or it may overwrite existing data
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

	// add a single model to the cache, which may or may not yet exist
	addModelToCache (model, callback) {
		let id = model.id;
		let modelOps = this.modelOps[id];	// ops (directives) associated with this model
		let cachedModel = this.models[id];	// the cached model, if any
		if (cachedModel) {
			if (modelOps) {
				// since we have ops for this model, we have to make the "existence" of this model
				// a $set op, which will be first in the chain of ops
				modelOps.push({ '$set': model.attributes });
			}
			else {
				// have a cached model with no ops, we can just assign attributes
				Object.assign(cachedModel.attributes, model.attributes);
			}
		}
		else {
			// a new model, truly add it to our cache
			this.models[id] = model;
		}
		return callback && process.nextTick(callback);
	}

	// add a series of models to the cache
	_addModelsToCache (models, callback) {
		BoundAsync.forEachLimit(
			this,
			models,
			50,
			this.addModelToCache,
			callback
		);
	}

	// remove a model from the cache
	_removeModelFromCache (id) {
		delete this.models[id];			// really remove it
		delete this.modelOps[id];		// remove any associated ops
		delete this.dirtyModelIds[id];	// can't be dirty if it doesn't exist!
		delete this.toCreateIds[id];	// can't be created and also deleted!
	}

	// add an op (directive) for a given model by ID
	_addModelOp (id, op) {
		let isDirty = this.dirtyModelIds[id] || this.toCreateIds[id];	// dirty if updated or created
		// get the cached model, or create it if it doesn't exist
		let cachedModel = this.models[id];
		if (!cachedModel) {
			this.models[id] = new this.modelClass({ [this.idAttribute]: id });
		}
		// start an ordered ops array as needed
		this.modelOps[id] = this.modelOps[id] || [];
		if (cachedModel && isDirty && this.modelOps[id].length === 0) {
			// if we don't have any ops already, then create a $set op to capture the existing model
			// (but this isn't necessary if it's not dirty, since we can just apply the ops to the database)
			this.modelOps[id].push({ '$set': cachedModel.attributes });
		}
		// add the new op
		this.modelOps[id].push(op);
		// if it hasn't been created, then the op necessarily makes it dirty (in need of persistence)
		if (!this.toCreateIds[id]) {
			this.dirtyModelIds[id] = true;
		}
		// apply the op to our model, so its attributes change accordingly
		ModelOps.applyOp(this.models[id], op);
	}

	// persist document updates to the database
	_persistDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.dirtyModelIds),
			50,
			this._persistDocument,
			callback
		);
	}

	// persist a single document update to the database
	_persistDocument (id, callback) {
		let modelOps = this.modelOps[id];
		if (modelOps && modelOps.length > 0) {
			// if we have ops (directives), then we need to apply those in order, can't just write the data
			return this._persistDocumentByOps(id, modelOps, callback);
		}
		// do the database update
		let model = this._getFromCache(id);
		if (!model) { return process.nextTick(callback); }
		model.attributes[this.idAttribute] = id;
		this.databaseCollection.update(
			model.attributes,
			error => {
				if (error) { return callback(error); }
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

	// apply the ops (directives) we have for a model by letting the database layer perform the operations
	_persistDocumentByOps (id, ops, callback) {
		this.databaseCollection.applyOpsById(
			id,
			ops,
			(error) => {
				if (error) { return callback(error); }
				delete this.modelOps[id];	// we've applied the ops, no longer needed
				delete this.dirtyModelIds[id]; // the model is no longer dirty
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

	// create a series of documents in the database
	_createDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.toCreateIds),
			20,
			this._createDocument,
			callback
		);
	}

	// create a single document in the database
	_createDocument (id, callback) {
		let model = this._getFromCache(id);
		if (!model) { return callback(); }
		this.databaseCollection.create(
			model.attributes,
			(error, createdDocument) => {
				if (error) { return callback(error); }
				this._addDataToCache(createdDocument);	// update our cache
				delete this.toCreateIds[id];	// no longer needs to be created!
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

	// delete a series of documents in the database
	_deleteDocuments (callback) {
		BoundAsync.forEachLimit(
			this,
			Object.keys(this.toDeleteIds),
			50,
			this._deleteDocument,
			callback
		);
	}

	// delete a single document in the database
	_deleteDocument (id, callback) {
		this.databaseCollection.deleteById(
			id,
			(error) => {
				if (error) { return callback(error); }
				this._removeModelFromCache(id);	// it's gone now!
				delete this.toDeleteIds[id];	// no longer needs to be deleted!
				process.nextTick(callback);
			},
			Object.assign({}, this.options.databaseOptions, { requestId: this.requestId })
		);
	}

	// get an ID from the database layer that is safe to use in queries that involve IDs
	// (so it's not just a string representation, which we normally use)
	objectIdSafe (id) {
		return this.databaseCollection.objectIdSafe(id);
	}

	// given a set of IDs, get a query to fetch them, hiding the implementation details
	inQuery (ids) {
		return this.databaseCollection.inQuery(ids);
	}

	// given a set of IDs, get a query to fetch them, hiding the implementation details
	// ensure the IDs are in the proper format for the underlying database
	inQuerySafe (ids) {
		return this.databaseCollection.inQuerySafe(ids);
	}
}

module.exports = DataCollection;
