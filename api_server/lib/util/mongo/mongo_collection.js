'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ObjectID = require('mongodb').ObjectID;
var ErrorHandler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

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

	runQuery (mongoFunc, query, callback, options, ...args) {
		options = options || {};
		const startTime = Date.now();
		const requestId = options.requestId;
		delete options.requestId;

		let queryCallback = (error, results) => {
			const time = Date.now() - startTime;
			let logOptions = { query, mongoFunc, time, requestId, error };
			logOptions.queryOptions = options;
			this._logMongoQuery(logOptions, args);
			if (error) {
				return callback(this.errorHandler.dataError(error));
			}
			else {
				callback(null, results);
			}
		};

		let mongoArgs = [query, ...args, options, queryCallback];
		this.dbCollection[mongoFunc].apply(
			this.dbCollection,
			mongoArgs
		);
	}

	getById (id, callback, options) {
		let query = {};
		query[this.idAttribute] = this.objectIdSafe(id);
		if (!query[this.idAttribute]) {
			return callback(null, null);
		}
		this.runQuery(
			'findOne',
			query,
			(error, result) => {
				this._idStringifyResult(error, result, callback);
			},
			options
		);
	}

	getByIds (ids, callback, options) {
		let query = {};
		let objectIds = [];
		BoundAsync.forEachLimit(
			this,
			ids,
			50,
			(id, foreachCallback) => {
				objectIds.push(this.objectIdSafe(id));
				process.nextTick(foreachCallback);
			},
			() => {
				query[this.idAttribute] = { $in: objectIds };
				this.getByQuery(query, callback, options);
			}
		);
	}

	getByQuery (query, callback, options = {}) {
		let cursor = this.dbCollection.find(query);
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

		let logQuery = (error) => {
			const requestId = options.requestId;
			delete options.requestId;
			const time = Date.now() - startTime;
			const mongoFunc = 'find';
			let logOptions = { query, mongoFunc, time, requestId, error };
			logOptions.queryOptions = options;
			this._logMongoQuery(logOptions);
		};

		let queryCallback = (error, results) => {
			logQuery(error);
			if (error) {
				return callback(this.errorHandler.dataError(error));
			}
			else {
				callback(null, results);
			}
		};

		if (!options.stream) {
			cursor.project(project).toArray((error, result) => {
				this._idStringifyResult(error, result, queryCallback);
			});
		}
		else {
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

	getOneByQuery (query, callback, options) {
		this.runQuery(
			'findOne',
			query,
			(error, result) => {
				this._idStringifyResult(error, result, callback);
			},
			options
		);
	}

	create (document, callback, options) {
		document._id = document._id ? this.objectIdSafe(document._id) : ObjectID();
		this.runQuery(
			'insertOne',
			document,
			(error) => {
				if (error) {
					return callback(this.errorHandler.dataError(error));
				}
				else {
					this._idStringify(document, callback);
				}
			},
			options
		);
	}

	createMany (documents, callback, options) {
		this.runQuery(
			'insertMany',
			documents,
			(error, result) => {
				this._idStringifyResult(error, result.ops, callback);
			},
			options
		);
	}

	update (document, callback, options) {
		let id = document[this.idAttribute];
		if (!id) {
			return callback(this.errorHandler.error('id', { info: this.idAttribute }));
		}
		this.updateById(id, document, callback, options);
	}

	updateById (id, data, callback, options) {
		delete data._id;
		this._applyMongoOpById(
			id,
			{ $set: data },
			callback,
			options
		);
	}

	applyOpsById (id, ops, callback, options) {
		BoundAsync.forEachSeries(
			this,
			ops,
			(op, foreachCallback) => {
				this.applyOpById(id, op, foreachCallback, options);
			},
			callback
		);
	}

	applyOpById (id, op, callback, options) {
		let mongoOp = this.opToDbOp(op);
		this._applyMongoOpById(id, mongoOp, callback, options);
	}

	opToDbOp (op) {
		let dbOp = {};
		Object.keys(OP_TO_DB_OP).forEach(opKey => {
			let opValue = op[opKey];
			if (typeof opValue === 'object') {
				let conversion = OP_TO_DB_OP[opKey];
				if (typeof conversion === 'object') {
					dbOp[conversion.dbOp] = conversion.valueFunc(opValue);
				}
				else {
					 dbOp[conversion] = opValue;
				}
			}
		});
		return dbOp;
	}

	_applyMongoOpById (id, op, callback, options) {
		let query = {};
		query[this.idAttribute] = this.objectIdSafe(id) || id;
		this.runQuery(
			'updateOne',
			query,
			callback,
			options,
			op
		);
	}

	updateDirect (query, data, callback, options) {
		this.runQuery(
			'updateMany',
			query,
			callback,
			options,
			data
		);
	}

	findAndModify (query, data, callback, options = {}) {
		this.runQuery(
			'findAndModify',
			query,
			callback,
			options,
			{},
			data,
			options.databaseOptions
		);
	}

	deleteById (id, callback, options) {
		let query = {
			[this.idAttribute]: this.objectIdSafe(id)
		};
		this.runQuery(
			'deleteOne',
			query,
			callback,
			options
		);
	}

	deleteByIds (ids, callback, options) {
		let query = {};
		let objectIds = [];
		BoundAsync.forEachLimit(
			this,
			ids,
			50,
			(id, foreachCallback) => {
				objectIds.push(this.objectIdSafe(id));
				process.nextTick(foreachCallback);
			},
			() => {
				query[this.idAttribute] = { $in: objectIds };
				this.deleteByQuery(query, callback, options);
			}
		);
	}

	deleteByQuery (query, callback, options) {
		this.runQuery(
			'deleteMany',
			query,
			callback,
			options
		);
	}

	_jsonStringify (json) {
		return JSON.stringify(json).
			replace(/\n/g,'').
			replace(/\s+/g, ' ');
	}

	_logMongoQuery (options, ...args) {
		if (!this.options.queryLogger) {
			return;
		}
		this._logMongoQueryToLogger(this.options.queryLogger, options, args);
	}

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
		let queryString = this._jsonStringify(query);
		let optionsString = this._jsonStringify(queryOptions);
		let additionalArgumentsString = this._jsonStringify(args || {});
		let fullQuery = `${requestId} db.${this.dbCollection.collectionName}.${mongoFunc}(${queryString},${optionsString},${additionalArgumentsString})`;
		logger.log(`${fullQuery}|${time}|${error}`);
		if (
			!noSlow &&
			this.options.slowLogger &&
			this.options.slowLogger.slowThreshold &&
			time >= this.options.slowLogger.slowThreshold
		) {
			delete options.noSlow;
			this._logMongoQueryToLogger(this.options.slowLogger, Object.assign({}, options, {noSlow: true}), args);
		}
		if (
			!noSlow &&
			this.options.reallySlowLogger &&
			this.options.reallySlowLogger.slowThreshold &&
			time >= this.options.reallySlowLogger.slowThreshold
		) {
			delete options.noSlow;
			this._logMongoQueryToLogger(this.options.reallySlowLogger, Object.assign({}, options, {noSlow: true}), args);
		}
	}

	objectIdSafe (id) {
		try {
			id = ObjectID(id);
		}
		catch(error) {
			return null;
		}
		return id;
	}

	createId () {
		return ObjectID();
	}

	_idStringifyResult (error, result, callback) {
		if (error) {
			return callback(this.errorHandler.dataError(error));
		}
		this._idStringify(result, callback);
	}

	_idStringify (object, callback) {
		if (object instanceof Array) {
			this._idStringifyAsync(object, callback);
		}
		else if (object && typeof object === 'object') {
			if (object[this.idAttribute]) {
				object[this.idAttribute] = object[this.idAttribute].toString();
			}
			return process.nextTick(() => {
				callback(null, object);
			});
		}
		else {
			return callback(null, object);
		}
	}

	_idStringifyAsync (objects, callback) {
		BoundAsync.forEachLimit(
			this,
			objects,
			100,
			this._idStringify,
			() => {
				callback(null, objects);
			}
		);
	}
}

module.exports = MongoCollection;
