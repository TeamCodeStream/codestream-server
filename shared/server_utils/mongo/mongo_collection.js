// Provides the MongoCollection object, a wrapper to the node mongo driver's Collection object,
// providing ease-of-use functions and built-in query logging

'use strict';

const ObjectID = require('mongodb').ObjectID;
const ErrorHandler = require('../error_handler');
const Errors = require('./errors');

// bridges an array operation to mongo by allowing the caller to specify an
// array of elements to add or remove without having to use the $each directive ... 
// otherwise the array of elements itself is interpreted as the element to add or remove,
// we're trying to shield the caller from the mongo implementation detail as much
// as possible for the most common use case
let _mongoArrayFunc = function(value, op) {
	let mongoValue = {};
	Object.keys(value).forEach(fieldName => {
		let fieldValue = value[fieldName];
		if (fieldValue instanceof Array) {
			mongoValue[fieldName] = { [op]: fieldValue };
		}
		else {
			mongoValue[fieldName] = fieldValue;
		}
	});
	return mongoValue;
};

let _mongoArrayEachFunc = function(value) {
	return _mongoArrayFunc(value, '$each');
};

let _mongoArrayInFunc = function(value) {
	return _mongoArrayFunc(value, '$in');
};

// these ops are intended to shield the caller from mongo's implementation details,
// but in practice we're basically using the same ops (with the subtle difference of
// $addToSet) ... expanded implementations may change this behavior somewhat
const OP_TO_DB_OP = {
	'$set': '$set',
	'$unset': '$unset',
	'$addToSet': {
		dbOp: '$addToSet',
		valueFunc: _mongoArrayEachFunc
	},
	'$push': {
		dbOp: '$push',
		valueFunc: _mongoArrayEachFunc
	},
	'$pull': {
		dbOp: '$pull',
		valueFunc: _mongoArrayInFunc
	},
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
		options = Object.assign({}, options || {});
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
	async getById (id, options) {
		const query = {
			[this.idAttribute]: this.objectIdSafe(id) // convert to mongo ID
		};
		if (!query[this.idAttribute]) {
			// no document if no ID!
			return null;
		}
		let result = await this._runQuery(
			'findOne',
			query,
			options
		);

		// turn any IDs we see into strings
		return await this._idStringify(result);
	}

	// get several documents by their IDs, we'll shield the caller from having to maintain
	// a mongo ID; they can use a simple string instead
	async getByIds (ids, options = {}) {
		// make an $in query out of the IDs
		const query = {
			[this.idAttribute]: this.inQuerySafe(ids)
		};
		if (this.options.hintsRequired) {
			options = Object.assign({}, options, { hint: { _id: 1 } });
		}
		return await this.getByQuery(query, options);
	}

	// get several documents according to the specified query, providing sort, limit, and fields options
	// optional streaming of the results is also supported
	async getByQuery (query, options = {}) {
		if (this.options.hintsRequired && !options.hint && !options.overrideHintRequired) {
			throw this.errorHandler.error('hintRequired', { query: query });
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
				throw this.errorHandler.dataError(error);
			}
			result = await this._idStringify(result); // turn any IDs we see into strings
			logQuery();
			return result;
		}
		else {
			// stream the results, passing back just the cursor, the caller will
			// be responsible for iterating
			return {
				cursor: cursor,
				done: (error, results) => {
					logQuery(error, results);
				}
			};
		}
	}

	// get a single document (first we find) according to the specified query
	async getOneByQuery (query, options) {
		if (this.options.hintsRequired && !options.hint && !options.overrideHintRequired) {
			throw this.errorHandler.error('hintRequired', { query: query });
		}
		const result = await this._runQuery(
			'findOne',
			query,
			options
		);
		// turn any IDs we see into strings
		return await this._idStringify(result);
	}

	// create a document
	async create (document, options) {
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
			throw this.errorHandler.dataError(error);
		}
		// to return the document, turn any IDs we see into strings
		return await this._idStringify(document);
	}

	// create many documents
	async createMany (documents, options) {
		const result = await this._runQuery(
			'insertMany',
			documents,
			options
		);
		// to return the documents, turn any IDs we see into strings
		return await this._idStringify(result.ops);
	}

	// update a document
	async update (document, options) {
		const id = document[this.idAttribute];
		if (!id) {
			// must have an ID to update!
			throw this.errorHandler.error('id', { info: this.idAttribute });
		}
		return await this.updateById(id, document, options);
	}

	// update a document with an explicitly provided ID
	async updateById (id, data, options) {
		let set = Object.assign({}, data);
		delete set._id; // since we're using the explicit ID, we'll ignore the one in the data
		// apply a $set to the data
		return await this._applyMongoOpById(
			id,
			{ $set: set },
			options
		);
	}

	// apply a series of ops (directives) to modify the data associated with the specified
	// document
	async applyOpsById (id, ops, options) {
		const totalOp = this.collapseOps(ops);
		await this.applyOpById(id, totalOp, options);
	}

	// collapse an array of ops into a single op
	collapseOps (ops) {
		let totalOp = {};
		ops.forEach(givenOp => {
			Object.values(OP_TO_DB_OP).forEach(op => {
				if (typeof op === 'object') {
					op = op.dbOp;
				}
				if (givenOp[op]) {
					totalOp[op] = totalOp[op] || {};
					Object.assign(totalOp[op], givenOp[op]);
				}
			});
		});
		return totalOp;
	}

	// apply a single op (directive) to modify the data associated with the specified document
	async applyOpById (id, op, options) {
		const mongoOp = this.opToDbOp(op); // convert into mongo language
		return await this._applyMongoOpById(id, mongoOp, options);
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
	async _applyMongoOpById (id, op, options) {
		let query = {};
		query[this.idAttribute] = this.objectIdSafe(id) || id;
		return await this._runQuery(
			'updateOne',
			query,
			options,
			op
		);
	}

	// update documents directly, the caller can do whatever they want with the database
	async updateDirect (query, data, options) {
		return await this._runQuery(
			'updateMany',
			query,
			options,
			data
		);
	}

	// do a find-and-modify operation, a cheap atomic operation
	async findAndModify (query, data, options = {}) {
		return await this._runQuery(
			'findAndModify',
			query,
			options,
			{},
			data,
			options.databaseOptions
		);
	}

	// delete a document by id
	async deleteById (id, options) {
		const query = {
			[this.idAttribute]: this.objectIdSafe(id)
		};
		return await this._runQuery(
			'deleteOne',
			query,
			options
		);
	}

	// delete several documents by id
	async deleteByIds (ids, options) {
		// make an $in query out of the IDs
		const query = {
			[this.idAttribute]: this.inQuerySafe(ids)
		};
		return await this.deleteByQuery(query, options);
	}

	// delete documents by query ... VERY DANGEROUS!!!
	async deleteByQuery (query, options) {
		return await this._runQuery(
			'deleteMany',
			query,
			options
		);
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
