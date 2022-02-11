// See README in this directory ... The DataCollection class offers an abstraction layer
// above the layer of a collection that actually fetches data from a database

'use strict';

const DataCollectionFetcher = require('./data_collection_fetcher');
const ModelOps = require('./model_ops');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const Errors = require('./errors');

class DataCollection {

	constructor (options) {
		this.options = options;
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
			requestId: this.requestId
		};
		this.clear();	// initialize our cache and other things
	}

	// clear our cache and associated data
	clear () {
		this.models = {};				// cached models
		this.modelOps = {};				// cached operations to perform on models
		this.toDeleteIds = {};			// models that should be deleted when we persist
		this.toCreateIds = {};			// models that should be created when we persist
		this.documentOptions = {};		// database options associated with documents being persisted
		this.directQueries = [];		// direct queries still queued for when other documents get persisted
	}

	// get a single model by ID
	async getById (id, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		return await new DataCollectionFetcher(this.fetchOptions).getById(id, options);
	}

	// get several models by ID
	async getByIds (ids, options) {
		// dole this out to the DataCollectionFetcher, which handles the details of checking cache and/or database
		return await new DataCollectionFetcher(this.fetchOptions).getByIds(ids, options);
	}

	// get models by a direct database query (which is specific to the underlying database)
	// NOTA BENE: this query is passed directly on to the database layer, no attempt is made to parse the
	// query and fetch documents from the cache ... this creates the potential for a conflict between
	// models that are cached and documents in the database ... care should be taken to recognize this
	// caveat
	async getByQuery (conditions, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
		const documents = await this.databaseCollection.getByQuery(
			conditions,
			Object.assign({}, options, { requestId: this.requestId })
		);
		let models;
		if (!options.noCache) {
			models = await this._addDocumentsToCache(documents);
		}
		return models || documents;
	}

	// get the first single model we find matching a direct database query ... see the note from
	// getByQuery above ... the same caveat applies here
	async getOneByQuery (conditions, options = {}) {
		// query the database collection directly, but we'll still add the documents to our local cache as needed
		const document = await this.databaseCollection.getOneByQuery(
			conditions,
			Object.assign({}, options, { requestId: this.requestId })
		);
		let model;
		if (document && !options.noCache) {
			model = this._addDataToCache(document);
		}
		return model || document;
	}

	// create a model using the data passed in
	async create (data, options = {}) {
		// the ID can be provided or we'll generate one
		const id = (data.id || this.createId()).toString();
		data.id = id;
		data._id = id;	// DEPRECATE ME
		if (!options.noVersion) {
			data.version = 1;
		}
		const model = new this.modelClass(data);
		this.addModelToCache(model);
		// if we're creating a model, it pretty much obviates anything else we've done to it
		delete this.toDeleteIds[id];
		delete this.modelOps[id];
		this.toCreateIds[id] = true;
		if (options) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options);
		}
		return model;
	}

	// create a model directly, no caching or transaction 
	async createDirect (data, options = {}) {
		return this.databaseCollection.create(
			data,
			Object.assign({}, options, { requestId: this.requestId })
		);
	}
	
	// create many models using the data passed in
	async createMany (documents, options = {}) {
		await Promise.all(documents.map(async document => {
			await this.create(document, options);
		}));
	}

	// generate an ID for a new model
	createId () {
		// we'll get it directly from the database collection
		return this.databaseCollection.createId().toString();
	}

	// update a model
	async update (data, options = {}) {
		const id = data.id || options.id;
		delete data.id;
		if (!id) {
			// we must have an ID for it, either in options or in the attributes
			throw this.errorHandler.error('id', { info: 'id' });
		}
		// applying an update is always a $set operation
		return await this.applyOpById(id, { $set: data}, options);
	}

	// apply an op (directive) to a model
	async applyOpById (id, op, options = {}) {
		// ops just get added to an ordered array of them, to be executed in order at persist time
		const modelOp = this._addModelOp(id, op);
		if (options) {
			// we'll save these up until we actually persist to the database
			this.documentOptions[id] = Object.assign(this.documentOptions[id] || {}, options);
		}
		return modelOp;
	}

	// delete a model by ID
	async deleteById (id) {
		// remove it from our cache
		this._removeModelFromCache(id);
		// mark it for actual deletion when we persist
		this.toDeleteIds[id] = true;
	}

	// delete a set of models by ID
	async deleteByIds (ids) {
		ids.forEach(id => {
			this.deleteById(id);
		});
	}

	// perform a direct update operation, this essentially passes through to the database layer,
	// no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	async updateDirect (query, data, options = {}) {
		return await this.databaseCollection.updateDirect(
			query,
			data,
			Object.assign({}, options, { requestId: this.requestId })
		);
	}

	// perform a direct update operation, but do it when other changes persist, not right now
	// this allows the caller to specify a direct pass-through operation to the database, but
	// one that won't go through immediately, but instead will go through when all the other
	// changes that have been queued for persistence go through
	// NOTE that there is no guarantee of order here, operations should be independent
	// of any other operations being performed in this transaction
	async updateDirectWhenPersist (query, data, options = {}) {
		this.directQueries.push({
			query,
			data,
			options
		});
	}

	// count by query, pass through to the database collection
	async countByQuery(query, options = {}) {
		return await this.databaseCollection.countByQuery(query, options);
	}

	// perform a direct find-and-modify operation against the database
	// find-and-modify performs an operation on a document but also returns the document in
	// its original state (before the operation) ... it is an atomic operation so can be used
	// to protect against race conditions
	// there is no interaction with the cache at all, so should be used with caution to avoid sync problems
	// between cache and database
	async findAndModify (query, data, options = {}) {
		const result = await this.databaseCollection.findAndModify(
			query,
			data,
			Object.assign({}, options, { requestId: this.requestId })
		);
		return result.value;
	}

	// persist all our recorded changes to the database ... a momentous occasion!
	async persist () {
		await this._persistDocumentOps(); // persist document updates
		await this._deleteDocuments();  // delete any documents requested
		await this._createDocuments();   // create any documents requested
		await this._persistDirectQueries(); // persists any direct operations
	}

	// persist any direct updates established through updateDirectWhenPersist()
	async _persistDirectQueries () {
		if (this.directQueries.find(queryInfo => queryInfo.options.persistInSeries)) {
			for (let queryInfo of this.directQueries) {
				const { query, data, options } = queryInfo;
				await this.updateDirect(query, data, options);
			}
		} else {
			await Promise.all(this.directQueries.map(async queryInfo => {
				const { query, data, options } = queryInfo;
				await this.updateDirect(query, data, options);
			}));
		}
	}

	// get a model from the cache by ID
	_getFromCache (id) {
		return this.models[id];
	}

	// add data a single model in the cache, which may be new data or it may overwrite existing data
	_addDataToCache (data) {
		const id = data.id;
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
		const cachedModel = this.models[model.id];
		if (cachedModel) {
			Object.assign(cachedModel.attributes, model.attributes);
		}
		else {
			this.models[model.id] = model;
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
		delete this.toCreateIds[id];	// can't be created and also deleted!
	}

	// add an op (directive) for a given model by ID
	_addModelOp (id, op) {
		// if we're creating the model anyway, we can just apply the op to the attributes
		if (!this.toCreateIds[id]) {
			// merge the new op with any existing op for the model
			this.modelOps[id] = this.mergeOps(this.modelOps[id], op);
			this.modelOps[id].id = id;
			this.modelOps[id]._id = id;	// DEPRECATE ME
		}
		if (this.models[id]) {
			// apply the op to our model, so its attributes change accordingly
			ModelOps.applyOp(this.models[id], op);
		}
		return this.modelOps[id] || op;
	}

	// merge one op into another
	mergeOps (op1, op2) {
		op1 = op1 || {};
		const possibleOps = ModelOps.possibleOps();
		possibleOps.forEach(op => {
			if (op2[op]) {
				op1[op] = op1[op] || {};
				Object.assign(op1[op], op2[op]);
			}
		});
		return op1;
	}
	
	// persist document updates to the database
	async _persistDocumentOps () {
		await Promise.all(Object.keys(this.modelOps).map(async id => {
			await this._persistDocumentByOps(id, this.modelOps[id]);
		}));
	}

	// apply the ops (directives) we have for a model by letting the database layer perform the operations
	async _persistDocumentByOps (id, ops) {
		const updateOp = await this.databaseCollection.applyOpById(
			id,
			ops,
			Object.assign(
				{},
				this.documentOptions[id] || {},
				{ 
					requestId: this.requestId
				}
			)
		);
		const model = this.models[id];
		if (model) {
			ModelOps.applyOp(model, updateOp);	
		}
		delete this.modelOps[id];	// we've applied the ops, no longer needed
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
			Object.assign({}, { requestId: this.requestId })
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
