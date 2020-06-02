// Provides the MongoCollection object, a wrapper to the node mongo driver's Collection object,
// providing ease-of-use functions and built-in query logging

'use strict';

const ObjectID = require('mongodb').ObjectID;
const ErrorHandler = require('../error_handler');
const Errors = require('./errors');
const DeepClone = require('../deep_clone');

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
	async getById (id, options = {}) {
		id = this.objectIdSafe(id);	// convert to mongo ID
		if (!id) {
			// no document if no ID!
			return null;
		}

		const project = {};
		this._normalizeFieldsOptions(options, project);
		if (Object.keys(project).length > 0) {
			options.projection = project;
		}

		let result = await this._runQuery(
			'findOne',
			{ _id: id },
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
			_id: this.inQuerySafe(ids)
		};
		if (this.options.hintsRequired) {
			options = Object.assign({}, options, { hint: { _id: 1 } });
		}
		return await this.getByQuery(query, options);
	}

	// get several documents according to the specified query, providing sort, limit, and fields options
	// optional streaming of the results is also supported
	async getByQuery (query, options = {}) {
		let project = {};
		query = this._normalizeQueryOptions(query, options, project);
		let cursor = this.dbCollection.find(query, { hint: options.hint });
		if (options.sort) {
			cursor = cursor.sort(options.sort);
		}
		if (options.limit) {
			cursor = cursor.limit(options.limit);
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
				next: async () => {
					const result = await cursor.next();
					return this._idStringify(result);
				},
				done: (error, results) => {
					logQuery(error, results);
				}
			};
		}
	}

	// get a single document (first we find) according to the specified query
	async getOneByQuery (query, options = {}) {
		query = this._normalizeQueryOptions(query, options, {});
		const result = await this._runQuery(
			'findOne',
			query,
			options
		);
		// turn any IDs we see into strings
		return await this._idStringify(result);
	}

	// given query and options, normalize for direct communication with mongo
	_normalizeQueryOptions (query, options, project) {
		// turn id into _id
		if (query.id) {
			query = Object.assign({}, query);
			query._id = query.id;
			delete query.id;
		}

		// turn id into _id in hint
		if (options.hint && options.hint.id) {
			options.hint = Object.assign({}, options.hint);
			options.hint._id = options.hint.id;
			delete options.hint.id;
		}
		if (this.options.hintsRequired && !options.hint && !options.overrideHintRequired) {
			throw this.errorHandler.error('hintRequired', { query: query });
		}

		// turn id into _id in sort
		if (options.sort && options.sort.id) {
			options.sort = Object.assign({}, options.sort);
			options.sort._id = options.sort.id;
			delete options.sort.id;
		}

		this._normalizeFieldsOptions(options, project);

		return query;
	}

	// normalize fields options into a projection
	_normalizeFieldsOptions (options, project) {
		// turn id into _id in fields
		if (options.fields) {
			const index = options.fields.indexOf('id');
			if (index !== -1) {
				options.fields = [...options.fields];
				options.fields[index] = '_id';
			}
			options.fields.forEach(field => {
				project[field] = 1;
			});
			delete options.fields;
		}
		else if (options.excludeFields) {
			if (options.excludeFields.includes('id') || options.excludeFields.includes['_id']) {
				throw 'cannot exclude ID field';
			}
			options.excludeFields.forEach(field => {
				project[field] = 0;
			});
			delete options.excludeFields;
		}
	}

	// create a document
	async create (document, options = {}) {
		// get an ID in mongo ID form, or generate one
		if (document.id) {
			document._id = options.overrideId ? document.id : this.objectIdSafe(document.id);
			delete document.id;
		}
		else {
			document._id = ObjectID();
		}
		if (document.version === undefined && !options.noVersion) {
			document.version = 1;
		}

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
	async update (document, options = {}) {
		const id = document.id;
		if (!id) {
			// must have an ID to update!
			throw this.errorHandler.error('id', { info: 'id' });
		}
		return await this.updateById(id, document, options);
	}

	// update a document with an explicitly provided ID
	async updateById (id, data, options) {
		const set = Object.assign({}, data);
		delete set.id; delete set._id; // since we're using the explicit ID, we'll ignore the one in the data
		// apply a $set to the data
		return await this._applyMongoOpById(
			id,
			{ $set: set },
			options
		);
	}

	// apply a single set of ops (directives) to modify the data associated with the specified document
	async applyOpById (id, op, options) {
		const localOp = op;
		const mongoOp = this.opToDbOp(op); // convert into mongo language
		const updateOp = await this._applyMongoOpById(id, mongoOp, options);
		if (updateOp.$version) {
			localOp.$version = updateOp.$version;
			if (updateOp.$version.after) {
				localOp.$set = localOp.$set || {};
				localOp.$set.version = updateOp.$version.after;
			}
		}
		return op;
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
				else if (typeof opValue === 'object') {
					dbOp[conversion] = DeepClone(opValue);
				}
				else {
					dbOp[conversion] = opValue;
				}
			}
		});
		return dbOp;
	}

	// apply a mongo op to a document
	async _applyMongoOpById (id, op, options = {}) {
		if (op.id || op._id) {
			op = Object.assign({}, op);
			delete op.id;
			delete op._id;
		}
		if (options.version) {
			return await this._applyMongoOpByIdAndVersion(id, options.version, op, options);
		}
		let query = {};
		query._id = this.objectIdSafe(id) || id;
		await this._runQuery(
			'updateOne',
			query,
			options,
			op
		);
		return op;
	}

	async _applyMongoOpByIdAndVersion (id, version, op, options) {
		let i;
		const localOp = op;
		for (i = 0; i < 10; i++) {
			if (await this._tryApplyMongoOpByIdAndVersion(id, version, op, options)) {
				break;
			}
			const refetchedDocument = await this.getById(id, { version: 1 });
			if (refetchedDocument.version === version) {
				throw this.errorHandler.error('updateFailureNoVersion');
			}
			version = refetchedDocument.version;
		}
		if (i === 10) {
			throw this.errorHandler.error('updateFailureVersion');
		}
		const newVersion = version + 1;
		localOp.$set = localOp.$set || {};
		localOp.$set.version = newVersion;
		localOp.$version = {
			before: version,
			after: newVersion
		};
		return op;
	}

	async _tryApplyMongoOpByIdAndVersion (id, version, op, options) {
		const query = {
			_id: this.objectIdSafe(id),
			version
		};
		op.$inc = op.$inc || {};
		op.$inc.version = 1;
		const result = await this.updateDirect(
			query,
			op,
			options
		);
		return result && result.modifiedCount > 0;
	}

	// update documents directly, the caller can do whatever they want with the database
	async updateDirect (query, data, options) {
		if (query.id) {
			query = Object.assign({}, query);
			query._id = query.id;
			delete query.id;
		}
		return await this._runQuery(
			'updateMany',
			query,
			options,
			data
		);
	}

	// do a find-and-modify operation, a cheap atomic operation
	async findAndModify (query, data, options = {}) {
		if (query.id) {
			query = Object.assign({}, query);
			query._id = query.id;
			delete query.id;
		}
		const result = await this._runQuery(
			'findOneAndUpdate',
			query,
			options,
			data
		);
		await this._idStringify(result.value);
		return result;
	}

	// delete a document by id
	async deleteById (id, options) {
		const query = {
			_id: this.objectIdSafe(id)
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
			_id: this.inQuerySafe(ids)
		};
		return await this.deleteByQuery(query, options);
	}

	// delete documents by query ... VERY DANGEROUS!!!
	async deleteByQuery (query, options = {}) {
		query = this._normalizeQueryOptions(query, options, {});
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
	_logMongoQuery (options, args) {
		if (!this.options.queryLogger) {
			return;
		}
		this._logMongoQueryToLogger(this.options.queryLogger, options, args);
	}

	// log a mongo query to our logger
	_logMongoQueryToLogger (logger, options, args) {
		let {
			error = null,
			query = {},
			time = 0,
			mongoFunc = '???',
			requestId = 'NOREQ',
			queryOptions = {},
			noSlow = false
		} = options;
		const queryString = this._jsonStringify(this._sanitizeForLogging(query, 'query', options));
		const optionsString = this._jsonStringify(queryOptions);
		const additionalArgumentsString = this._jsonStringify(this._sanitizeForLogging(args || [], 'additionalArguments', options));
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
			if (object._id) {
				object.id = object._id = object._id.toString();
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

	// sanitize the passed structure for logging, ensuring sensitive data is removed
	_sanitizeForLogging (data, type, options) {
		const collectionName = this.dbCollection.collectionName;
		const { mongoFunc } = options;
		for (let noLogData of this.options.noLogData || []) {
			if (noLogData.collection === collectionName) {
				const { fields } = noLogData;
				if (mongoFunc === 'insertOne' && type === 'query') {
					data = DeepClone(data);
					return this._sanitizeInsertOneForLogging(data, fields);
				}
				else if (mongoFunc === 'insertMany' && type === 'query') {
					data = DeepClone(data);
					return this._sanitizeInsertManyForLogging(data, fields);
				}
				else if (['updateOne', 'updateMany', 'findOneAndUpdate'].indexOf(mongoFunc) !== -1 && type === 'additionalArguments') {
					data = DeepClone(data);
					return this._sanitizeUpdateForLogging(data, fields);
				}
			}
		}
		return data;
	}

	// sanitize the query structure to an insertOne, for logging, ensuring sensitive data is removed
	_sanitizeInsertOneForLogging (data, fields) {
		return this._sanitizeDataForLogging(data, fields);
	}
	
	// sanitize the query structure to an insertMany, for logging, ensuring sensitive data is removed
	_sanitizeInsertManyForLogging (data, fields) {
		const newData = [];
		if (!(data instanceof Array)) {
			return data;
		}
		for (let datum of data) {
			newData.push(this._sanitizeInsertOneForLogging(datum, fields));
		}
		return newData;
	}

	// sanitize the set op for an update operation, for logging, ensuring sensitive data is removed
	_sanitizeUpdateForLogging (data, fields) {
		if (!data[0] || !data[0].$set) {
			return data;
		}
		data[0].$set = this._normalizeSet(data[0].$set);
		data[0].$set = this._sanitizeDataForLogging(data[0].$set, fields);
		return data;
	}
	
	// normalize the set object, removing any fields with dot-notation and replacing with object equivalents
	_normalizeSet (set) {
		const multipartKeys = Object.keys(set).filter(key => key.match(/\./));
		if (multipartKeys.length === 0) {
			return set;
		}
		for (let key of multipartKeys) {
			const keyParts = key.split('.');
			set[keyParts[0]] = set[keyParts[0]] || {};
			const subKey = keyParts.slice(1).join('.');
			set[keyParts[0]][subKey] = set[key];
			this._normalizeSet(set[keyParts[0]]);
			delete set[key];
		}
		return set;
	}
	
	// sanitize the passed data object for logging, according to the fields passed in
	_sanitizeDataForLogging (data, fields) {
		for (let field of fields) {
			this._sanitizeFieldInObject(data, field);
		}
		return data;
	}
	
	// for a given field, sanitize that field out of the data object, for logging
	// includes recursive sanitization for sub-objects, if specified
	_sanitizeFieldInObject (obj, field) {
		const parts = field.split('.');
		if (parts.length > 1) {
			const topField = parts[0];
			const keys = topField === '*' ? Object.keys(obj) : [topField];
			for (let key of keys) {
				if (typeof obj[key] === 'object') {
					this._sanitizeFieldInObject(obj[key], parts.slice(1).join('.'));
				}
			}
		}
		else if (typeof obj[field] === 'string') {
			obj[field] = '*'.repeat(obj[field].length);
		}
		else if (typeof obj[field] === 'object') {
			obj[field] = {'*': '*'};
		}
	}
}

module.exports = MongoCollection;
