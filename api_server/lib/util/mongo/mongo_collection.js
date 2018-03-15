// Provides the MongoCollection object, a wrapper to the node mongo driver's Collection object,
// providing ease-of-use functions and built-in query logging

'use strict';

const ObjectID = require('mongodb').ObjectID;
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const Errors = require('./errors');

// bridges an $addToSet operation to mongo by allowing the caller to specify an
// array of elements to add without having to use the $each directive ... otherwise
// the array of elements is interpreted as a single element to add
// we're trying to shield the caller from the mongo implementation detail as much
// as possible for the most common use case
let _mongoAddToSetValue = function(value) {
	let mongoValue = {};
	Object.keys(value).forEach(fieldName => {
		let fieldValue = value[fieldName];
		if (fieldValue instanceof Array) {
			mongoValue[fieldName] = { $each: fieldValue };
		}
		else {
			mongoValue[fieldName] = fieldValue;
		}
	});
	return mongoValue;
};

// these ops are intended to shield the caller from mongo's implementation details,
// but in practice we're basically using the same ops (with the subtle difference of
// $addToSet) ... expanded implementations may change this behavior somewhat
const OP_TO_DB_OP = {
	'$set': '$set',
	'$unset': '$unset',
	'$addToSet': {
		dbOp: '$addToSet',
		valueFunc: _mongoAddToSetValue
	},
	'$push': '$push',
	'$pull': '$pull',
	'$inc': '$inc'
};

class MongoCollection {

	constructor (options) {
		this.options = options;
		this.idAttribute = options.idAttribute || '_id';
		this.dbCollection = options.dbCollection;
		if (!this.dbCollection) {
			throw 'no dbCollection in constructing MongoCollection';
		}
		this.errorHandler = new ErrorHandler(Errors);
	}

	// run a generic query, processing arguments as needed, and logging the query
	// for performance analysis
	async _runQuery (mongoFunc, query, options, ...args) {
		options = options || {};
		const startTime = Date.now();
		const requestId = options.requestId;
		delete options.requestId;
		const mongoArgs = [query, ...args, options];
		let results, error;
		const logQuery = () => {
			const time = Date.now() - startTime;
			const logOptions = { query, mongoFunc, time, requestId, error };
			logOptions.queryOptions = options;
			this._logMongoQuery(logOptions, args);
		};
		try {
			results = await this.dbCollection[mongoFunc].apply(
				this.dbCollection,
				mongoArgs
			);
			logQuery();
			return results;
		}
		catch (error) {
			logQuery();
			throw this.errorHandler.dataError(error);
		}
	}

	// get a document by its ID, we'll shield the caller from having to maintain
	// a mongo ID; they can use a simple string instead
	async getById (id, callback, options) {
		const query = {
			[this.idAttribute]: this.objectIdSafe(id) // convert to mongo ID
		};
		if (!query[this.idAttribute]) {
			// no document if no ID!
			return callback(null, null);
		}
		let result = await this._runQuery(
			'findOne',
			query,
			options
		);

		// turn any IDs we see into strings
		result = await this._idStringify(result);
		return callback(null, result);
	}

	// get several documents by their IDs, we'll shield the caller from having to maintain
	// a mongo ID; they can use a simple string instead
	async getByIds (ids, callback, options = {}) {
		// make an $in query out of the IDs
		const query = {
			[this.idAttribute]: this.inQuerySafe(ids)
		};
		if (this.options.hintsRequired) {
			options = Object.assign({}, options, { hint: { _id: 1 } });
		}
		return await this.getByQuery(query, callback, options);
	}

	// get several documents according to the specified query, providing sort, limit, and fields options
	// optional streaming of the results is also supported
	async getByQuery (query, callback, options = {}) {
		if (this.options.hintsRequired && !options.hint && !options.overrideHintRequired) {
			return callback(this.errorHandler.error('hintRequired', { query: query }));
		}
		let cursor = this.dbCollection.find(query, { hint: options.hint });
		if (options.sort) {
			cursor = cursor.sort(options.sort);
		}
		if (options.limit) {
			cursor = cursor.limit(options.limit);
		}
		let project = {};
		if (options.fields) {
			options.fields.forEach(field => {
				project[field] = 1;
			});
		}
		const startTime = Date.now();

		// log the query here
		const logQuery = (error) => {
			const requestId = options.requestId;
			delete options.requestId;
			const time = Date.now() - startTime;
			const mongoFunc = 'find';
			let logOptions = { query, mongoFunc, time, requestId, error };
			logOptions.queryOptions = options;
			this._logMongoQuery(logOptions);
		};

		if (!options.stream) {
			// if we're just fetching all the results, turn into an array
			let result;
			try {
				result = await cursor.project(project).toArray();
			}
			catch (error) {
				logQuery(error);
				return callback(this.errorHandler.dataError(error));
			}
			result = await this._idStringify(result); // turn any IDs we see into strings
			logQuery();
			return callback(null, result);
		}
		else {
			// stream the results, passing back just the cursor, the caller will
			// be responsible for iterating
			return callback(
				null,
				{
					cursor: cursor,
					done: (error, results) => {
						logQuery(error, results);
					}
				}
			);
		}
	}

	// get a single document (first we find) according to the specified query
	async getOneByQuery (query, callback, options) {
		if (this.options.hintsRequired && !options.hint && !options.overrideHintRequired) {
			return callback(this.errorHandler.error('hintRequired', { query: query }));
		}
		let result;
		try {
			result = await this._runQuery(
				'findOne',
				query,
				options
			);
		}
		catch (error) {
			callback(error);
		}
		// turn any IDs we see into strings
		result = await this._idStringify(result);
		return callback(null, result);
	}

	// create a document
	async create (document, callback, options) {
		// get an ID in mongo ID form, or generate one
		document._id = document._id ? this.objectIdSafe(document._id) : ObjectID();
		// insert the document
		try {
			await this._runQuery(
				'insertOne',
				document,
				options
			);
		}
		catch (error) {
			callback(this.errorHandler.dataError(error));
		}
		// to return the document, turn any IDs we see into strings
		document = await this._idStringify(document);
		return callback(null, document);
	}

	// create many documents
	async createMany (documents, callback, options) {
		let result;
		try {
			result = await this._runQuery(
				'insertMany',
				documents,
				options
			);
		}
		catch (error) {
			callback(error);
		}
		// to return the documents, turn any IDs we see into strings
		result = await this._idStringify(result.ops);
		return callback(null, result);
	}

	// update a document
	async update (document, callback, options) {
		const id = document[this.idAttribute];
		if (!id) {
			// must have an ID to update!
			return callback(this.errorHandler.error('id', { info: this.idAttribute }));
		}
		return await this.updateById(id, document, callback, options);
	}

	// update a document with an explicitly provided ID
	async updateById (id, data, callback, options) {
		let set = Object.assign({}, data);
		delete set._id; // since we're using the explicit ID, we'll ignore the one in the data
		// apply a $set to the data
		await this._applyMongoOpById(
			id,
			{ $set: set },
			callback,
			options
		);
	}

	// apply a series of ops (directives) to modify the data associated with the specified
	// document
	async applyOpsById (id, ops, callback, options) {
		try {
			// just break these down and do them one by one, no better way
			await Promise.all(ops.map(async op => {
				return await this.applyOpById(id, op, null, options);
			}));
		}
		catch (error) {
			callback(error);
		}
		callback();
	}

	// apply a single op (directive) to modify the data associated with the specified document
	async applyOpById (id, op, callback, options) {
		const mongoOp = this.opToDbOp(op); // convert into mongo language
		return await this._applyMongoOpById(id, mongoOp, callback, options);
	}

	// convert ops from the more generic form into mongo language ... for now, the generic form
	// is VERY similar to mongo, but this allows the flexibility to change/enhance in the future
	opToDbOp (op) {
		let dbOp = {};
		Object.keys(OP_TO_DB_OP).forEach(opKey => {
			let opValue = op[opKey];
			if (typeof opValue === 'object') {
				let conversion = OP_TO_DB_OP[opKey];
				if (typeof conversion === 'object') {
					// here we handle differences between how mongo works and how we want to work,
					// by invoking a function to convert the value, rather than just taking it literally
					dbOp[conversion.dbOp] = conversion.valueFunc(opValue);
				}
				else {
					dbOp[conversion] = opValue;
				}
			}
		});
		return dbOp;
	}

	// apply a mongo op to a document
	async _applyMongoOpById (id, op, callback, options) {
		let query = {};
		query[this.idAttribute] = this.objectIdSafe(id) || id;
		try {
			const result = await this._runQuery(
				'updateOne',
				query,
				options,
				op
			);
			if (callback) {
				return callback(null, result);
			}
			else {
				return result;
			}
		}
		catch (error) {
			if (callback) {
				return callback(error);
			}
			else {
				throw error;
			}
		}
	}

	// update documents directly, the caller can do whatever they want with the database
	async updateDirect (query, data, callback, options) {
		try {
			const result = await this._runQuery(
				'updateMany',
				query,
				options,
				data
			);
			callback(null, result);
		}
		catch (error) {
			callback(error);
		}
	}

	// do a find-and-modify operation, a cheap atomic operation
	async findAndModify (query, data, callback, options = {}) {
		try {
			const result = await this._runQuery(
				'findAndModify',
				query,
				options,
				{},
				data,
				options.databaseOptions
			);
			callback(null, result);
		}
		catch (error) {
			callback(error);
		}
	}

	// delete a document by id
	async deleteById (id, callback, options) {
		const query = {
			[this.idAttribute]: this.objectIdSafe(id)
		};
		try {
			const result = this._runQuery(
				'deleteOne',
				query,
				options
			);
			callback(null, result);
		}
		catch (error) {
			callback(error);
		}
	}

	// delete several documents by id
	async deleteByIds (ids, callback, options) {
		// make an $in query out of the IDs
		const query = {
			[this.idAttribute]: this.inQuerySafe(ids)
		};
		return await this.deleteByQuery(query, callback, options);
	}

	// delete documents by query ... VERY DANGEROUS!!!
	async deleteByQuery (query, callback, options) {
		try {
			const result = await this._runQuery(
				'deleteMany',
				query,
				options
			);
			callback(null, result);
		}
		catch (error) {
			callback(error);
		}
	}

	// helper JSON.stringify to clean up whitespace
	_jsonStringify (json) {
		return JSON.stringify(json).
			replace(/\n/g,'').
			replace(/\s+/g, ' ');
	}

	// log a mongo query to our logger
	_logMongoQuery (options, ...args) {
		if (!this.options.queryLogger) {
			return;
		}
		this._logMongoQueryToLogger(this.options.queryLogger, options, args);
	}

	// log a mongo query to our logger
	_logMongoQueryToLogger (logger, options, ...args) {
		let {
			error = null,
			query = {},
			time = 0,
			mongoFunc = '???',
			requestId = 'NOREQ',
			queryOptions = {},
			noSlow = false
		} = options;
		const queryString = this._jsonStringify(query);
		const optionsString = this._jsonStringify(queryOptions);
		const additionalArgumentsString = this._jsonStringify(args || {});
		const fullQuery = `${requestId} db.${this.dbCollection.collectionName}.${mongoFunc}(${queryString},${optionsString},${additionalArgumentsString})`;
		logger.log(`${fullQuery}|${time}|${error}`);
		if (
			!noSlow &&
			this.options.slowLogger &&
			this.options.slowLogger.slowThreshold &&
			time >= this.options.slowLogger.slowThreshold
		) {
			// this query was slow, log it to the slow-query log
			delete options.noSlow;
			this._logMongoQueryToLogger(this.options.slowLogger, Object.assign({}, options, {noSlow: true}), args);
		}
		if (
			!noSlow &&
			this.options.reallySlowLogger &&
			this.options.reallySlowLogger.slowThreshold &&
			time >= this.options.reallySlowLogger.slowThreshold
		) {
			// this query was REALLY slow, log it to the really-slow-query log
			delete options.noSlow;
			this._logMongoQueryToLogger(this.options.reallySlowLogger, Object.assign({}, options, {noSlow: true}), args);
		}
	}

	// return a mongo ID, given a mongo ID or a string representation
	objectIdSafe (id) {
		try {
			id = ObjectID(id);
		}
		catch(error) {
			return null;
		}
		return id;
	}

	inQuery (ids) {
		return { $in: ids };
	}

	inQuerySafe (ids) {
		ids = ids.map(id => this.objectIdSafe(id));
		return this.inQuery(ids);
	}

	// create a new ID
	createId () {
		return ObjectID();
	}

	// look for IDs or arrays of IDs in an object and stringify them, so the application layer
	// doesn't have to deal with mongo IDs
	async _idStringify (object) {
		if (object instanceof Array) {
			return await this._idStringifyArray(object);
		}
		else if (object && typeof object === 'object') {
			if (object[this.idAttribute]) {
				object[this.idAttribute] = object[this.idAttribute].toString();
			}
		}
		return object;
	}

	// handle sub-objects and stringify all IDs
	async _idStringifyArray (objects) {
		await Promise.all(
			objects.map(async object => {
				return await this._idStringify(object);
			})
		);
		return objects;
	}
}

module.exports = MongoCollection;
