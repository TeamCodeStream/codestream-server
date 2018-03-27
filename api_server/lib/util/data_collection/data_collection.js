// See README in this directory ... The DataCollection class offers an abstraction layer
// above the layer of a collection that actually fetches data from a database

'use strict';

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
	async getById (id, callback, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		let model;
		try {
			model = await new DataCollectionFetcher(this.fetchOptions).getById(
				id,
				options
			);
		}
		catch (error) {
			return callback(error);
		}
		callback(null, model);
	}

	// get several models by ID
	async getByIds (ids, callback, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		let models;
		try {
			models = await new DataCollectionFetcher(this.fetchOptions).getByIds(
				ids,
				options
			);
		}
		catch (error) {
			return callback(error);
		}
		callback(null, models);
	}

	// get models by a direct database query (which is specific to the underlying database)
	// NOTA BENE: this query is passed directly on to the database layer, no attempt is made to parse the
	// query and fetch documents from the cache ... this creates the potential for a conflict between
	// models that are cached and documents in the database ... care should be taken to recognize this
	// caveat
	async getByQuery (conditions, callback, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
		let documents;
		try {
			documents = await this.databaseCollection.getByQuery(
				conditions,
				Object.assign({}, options.databaseOptions, { requestId: this.requestId })
			);
		}
		catch (error) {
			return callback(error);
		}
		let models;
		if (!options.noCache) {
			models = await this._addDocumentsToCache(documents);
		}
		callback(null, models || documents);
	}

	// get the first single model we find matching a direct database query ... see the note from
	// getByQuery above ... the same caveat applies here
	async getOneByQuery (conditions, callback, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
		let document;
		try {
			document = await this.databaseCollection.getOneByQuery(
				conditions,
				Object.assign({}, options.databaseOptions, { requestId: this.requestId })
			);
		}
		catch (error) {
			return callback(error);
		}
		let model;
		if (document && !options.noCache) {
			model = this._addDataToCache(document);
		}
		callback(null, model || document);
	}

	// create a model using the data passed in
	async create (data, callback, options = {}) {
		// the ID can be provided or we'll generate one
		const id = (data[this.idAttribute] || this.createId()).toString();
		data[this.idAttribute] = id;
		const model = new this.modelClass(data);
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
	async update (data, callback, options = {}) {
		const id = data[this.idAttribute] || options.id;
		if (!id) {
			// we must have an ID for it, either in options or in the attributes
			return callback(this.errorHandler.error('id', { info: this.idAttribute }));
		}
		if (this.modelOps[id]) {
			// we already have ops for this, so we need to just add a $set
			return this.applyOpById(id, { $set: data }, callback, options);
		}
		data[this.idAttribute] = id;
		// update the data for this document in our cache
		this._addDataToCache(data);
		if (!this.toCreateIds[id]) {
			// only mark it as dirty (needs persisting) if we didn't create it, since the create will happen in a single go anyway
			this.dirtyModelIds[id] = true;
		}
		// fetch it whole from our cache, so we can return something to the caller
		const model = this._getFromCache(id);
		if (options.databaseOptions) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options.databaseOptions);
		}
		process.nextTick(() => {
			callback(null, model);
		});
	}

	// apply an op (directive) to a model
	async applyOpById (id, op, callback, options = {}) {
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
	async deleteById (id, callback) {
		// remove it from our cache
		this._removeModelFromCache(id);
		// mark it for actual deletion when we persist
		this.toDeleteIds[id] = true;
		process.nextTick(callback);
	}

	// perform a direct update operation, this essentially passes through to the database layer,
	// no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	async updateDirect (query, data, callback, options = {}) {
		let result;
		try {
			result = await this.databaseCollection.updateDirect(
				query,
				data,
				Object.assign({}, options, { requestId: this.requestId })
			);
		}
		catch (error) {
			return callback(error);
		}
		callback(null, result);
	}

	// perform a direct find-and-modify operation against the database
	// find-and-modify performs an operation on a document but also returns the document in
	// its original state (before the operation) ... it is an atomic operation so can be used
	// to protect against race conditions
	// there is no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	async findAndModify (query, data, callback, options = {}) {
		let result;
		try {
			result = await this.databaseCollection.findAndModify(
				query,
				data,
				Object.assign({}, options, { requestId: this.requestId })
			);
		}
		catch (error) {
			return callback(error);
		}
		result.value._id = result.value._id.toString();
		return callback(null, result.value);
	}

	// persist all our recorded changes to the database ... a momentous occasion!
	async persist (callback) {
		try {
			await this._persistDocuments(), // persist document updates
			await this._deleteDocuments(),  // delete any documents requested
			await this._createDocuments();   // create any documents requested
		}
		catch (error) {
			if (callback) {
				return callback(error);
			}
			else {
				throw error;
			}
		}
		if (callback) {
			callback();
		}
	}

	// get a model from the cache by ID
	_getFromCache (id) {
		return this.models[id];
	}

	// add data a single model in the cache, which many be new data or it may overwrite existing data
	_addDataToCache (data) {
		const id = data[this.idAttribute];
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
		return model;
	}

	// add a series of documents to the cache, which many be new data or it may overwrite existing data
	async _addDocumentsToCache (documents) {
		let models = [];
		await Promise.all(documents.map(async document => {
			const model = this._addDataToCache(document);
			models.push(model);
		}));
		return models;
	}

	// add a single model to the cache, which may or may not yet exist
	addModelToCache (model) {
		const id = model.id;
		const modelOps = this.modelOps[id];	// ops (directives) associated with this model
		const cachedModel = this.models[id];	// the cached model, if any
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
		return model;
	}

	// add a series of models to the cache
	async _addModelsToCache (models) {
		await Promise.all(models.map(async model => {
			this.addModelToCache(model);
		}));
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
		const isDirty = this.dirtyModelIds[id] || this.toCreateIds[id];	// dirty if updated or created
		// get the cached model, or create it if it doesn't exist
		const cachedModel = this.models[id];
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
	async _persistDocuments () {
		await Promise.all(Object.keys(this.dirtyModelIds).map(async id => {
			await this._persistDocument(id);
		}));
	}

	// persist a single document update to the database
	async _persistDocument (id) {
		const modelOps = this.modelOps[id];
		if (modelOps && modelOps.length > 0) {
			// if we have ops (directives), then we need to apply those in order, can't just write the data
			return await this._persistDocumentByOps(id, modelOps);
		}
		// do the database update
		const model = this._getFromCache(id);
		if (!model) { return; }
		model.attributes[this.idAttribute] = id;
		await this.databaseCollection.update(
			model.attributes,
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
		delete this.modelOps[id];
		delete this.dirtyModelIds[id];
	}

	// apply the ops (directives) we have for a model by letting the database layer perform the operations
	async _persistDocumentByOps (id, ops) {
		await this.databaseCollection.applyOpsById(
			id,
			ops,
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
		delete this.modelOps[id];	// we've applied the ops, no longer needed
		delete this.dirtyModelIds[id]; // the model is no longer dirty
	}

	// create a series of documents in the database
	async _createDocuments () {
		await Promise.all(Object.keys(this.toCreateIds).map(async id => {
			await this._createDocument(id);
		}));
	}

	// create a single document in the database
	async _createDocument (id) {
		let model = this._getFromCache(id);
		if (!model) { return; }
		const createdDocument = await this.databaseCollection.create(
			model.attributes,
			Object.assign(
				{},
				this.options.databaseOptions || {},
				this.documentOptions[id] || {},
				{ requestId: this.requestId }
			)
		);
		this._addDataToCache(createdDocument);	// update our cache
		delete this.toCreateIds[id];	// no longer needs to be created!
	}

	// delete a series of documents in the database
	async _deleteDocuments () {
		await Promise.all(Object.keys(this.toDeleteIds).map(async id => {
			await this._deleteDocument(id);
		}));
	}

	// delete a single document in the database
	async _deleteDocument (id) {
		await this.databaseCollection.deleteById(
			id,
			Object.assign({}, this.options.databaseOptions, { requestId: this.requestId })
		);
		this._removeModelFromCache(id);	// it's gone now!
		delete this.toDeleteIds[id];	// no longer needs to be deleted!
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
