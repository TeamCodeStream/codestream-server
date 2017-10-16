'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var ObjectID = require('mongodb').ObjectID;
var Error_Handler = require(process.env.CS_API_TOP + '/lib/util/error_handler');
const Errors = require('./errors');

const OP_TO_DB_OP = {
	set: '$set',
	unset: '$unset',
	add: '$addToSet',
	push: '$push',
	pull: '$pull'
};

class Mongo_Collection {

	constructor (options) {
		this.options = options;
		this.id_attribute = options.id_attribute || '_id';
		this.db_collection = options.db_collection;
		if (!this.db_collection) {
			throw 'no db_collection in constructing Mongo_Collection';
		}
		this.error_handler = new Error_Handler(Errors);
	}

	run_query (mongo_func, query, callback, options, ...args) {
		options = options || {};
		const start_time = Date.now();
		const request_id = options.request_id;
		delete options.request_id;

		let query_callback = (error, results) => {
			const time = Date.now() - start_time;
			let log_options = { query, mongo_func, time, request_id, error };
			log_options.query_options = options;
			this._log_mongo_query(log_options, args);
			if (error) {
				return callback(this.error_handler.data_error(error));
			}
			else {
				callback(null, results);
			}
		};

		let mongo_args = [query, ...args, options, query_callback];
		this.db_collection[mongo_func].apply(
			this.db_collection,
			mongo_args
		);
	}

	get_by_id (id, callback, options) {
		let query = {};
		query[this.id_attribute] = this.object_id_safe(id);
		if (!query[this.id_attribute]) {
			return callback(null, null);
		}
		this.run_query(
			'findOne',
			query,
			(error, result) => {
				this._id_stringify_result(error, result, callback);
			},
			options
		);
	}

	get_by_ids (ids, callback, options) {
		let query = {};
		let object_ids = [];
		Bound_Async.forEachLimit(
			this,
			ids,
			50,
			(id, foreach_callback) => {
				object_ids.push(this.object_id_safe(id));
				process.nextTick(foreach_callback);
			},
			() => {
				query[this.id_attribute] = { $in: object_ids };
				this.get_by_query(query, callback, options);
			}
		);
	}

	get_by_query (query, callback, options = {}) {
		let cursor = this.db_collection.find(query);
		if (options.sort) {
			cursor = cursor.sort(options.sort);
		}
		if (options.limit) {
			cursor = cursor.limit(options.limit);
		}
		const start_time = Date.now();

		let log_query = (error) => {
			const request_id = options.request_id;
			delete options.request_id;
			const time = Date.now() - start_time;
			const mongo_func = 'find';
			let log_options = { query, mongo_func, time, request_id, error };
			log_options.query_options = options;
			this._log_mongo_query(log_options);
		};

		let query_callback = (error, results) => {
			log_query(error);
			if (error) {
				return callback(this.error_handler.data_error(error));
			}
			else {
				callback(null, results);
			}
		};

		if (!options.stream) {
			cursor.toArray((error, result) => {
				this._id_stringify_result(error, result, query_callback);
			});
		}
		else {
			return callback(
				null,
				{
					cursor: cursor,
					done: (error, results) => {
						log_query(error, results);
					}
				}
			);
		}
	}

	get_one_by_query (query, callback, options) {
		this.run_query(
			'findOne',
			query,
			(error, result) => {
				this._id_stringify_result(error, result, callback);
			},
			options
		);
	}

	create (document, callback, options) {
		document._id = document._id ? this.object_id_safe(document._id) : ObjectID();
		this.run_query(
			'insertOne',
			document,
			(error) => {
				if (error) {
					return callback(this.error_handler.data_error(error));
				}
				else {
					this._id_stringify(document, callback);
				}
			},
			options
		);
	}

	create_many (documents, callback, options) {
		this.run_query(
			'insertMany',
			documents,
			(error, result) => {
				this._id_stringify_result(error, result.ops, callback);
			},
			options
		);
	}

	update (document, callback, options) {
		let id = document[this.id_attribute];
		if (!id) {
			return callback(this.error_handler.error('id', { info: this.id_attribute }));
		}
		this.update_by_id(id, document, callback, options);
	}

	update_by_id (id, data, callback, options) {
		delete data._id;
		this._apply_mongo_op_by_id(
			id,
			{ $set: data },
			callback,
			options
		);
	}

	apply_ops_by_id (id, ops, callback, options) {
		Bound_Async.forEachSeries(
			this,
			ops,
			(op, foreach_callback) => {
				this.apply_op_by_id(id, op, foreach_callback, options);
			},
			callback
		);
	}

	apply_op_by_id (id, op, callback, options) {
		let mongo_op = this.op_to_db_op(op);
		this._apply_mongo_op_by_id(id, mongo_op, callback, options);
	}

	op_to_db_op (op) {
		let db_op = {};
		Object.keys(OP_TO_DB_OP).forEach(op_key => {
			if (typeof op[op_key] === 'object') {
				db_op[OP_TO_DB_OP[op_key]] = op[op_key];
			}
		});
		return db_op;
	}

	_apply_mongo_op_by_id (id, op, callback, options) {
		let query = {};
		query[this.id_attribute] = this.object_id_safe(id);
		this.run_query(
			'updateOne',
			query,
			callback,
			options,
			op
		);
	}

	update_direct (query, data, callback, options) {
		this.run_query(
			'updateMany',
			query,
			callback,
			options,
			data
		);
	}

	delete_by_id (id, callback, options) {
		let query = {
			[this.id_attribute]: this.object_id_safe(id)
		};
		this.run_query(
			'deleteOne',
			query,
			callback,
			options
		);
	}

	delete_by_ids (ids, callback, options) {
		let query = {};
		let object_ids = [];
		Bound_Async.forEachLimit(
			this,
			ids,
			50,
			(id, foreach_callback) => {
				object_ids.push(this.object_id_safe(id));
				process.nextTick(foreach_callback);
			},
			() => {
				query[this.id_attribute] = { $in: object_ids };
				this.delete_by_query(query, callback, options);
			}
		);
	}

	delete_by_query (query, callback, options) {
		this.run_query(
			'deleteMany',
			query,
			callback,
			options
		);
	}

	_json_stringify (json) {
		return JSON.stringify(json).
			replace(/\n/g,'').
			replace(/\s+/g, ' ');
	}

	_log_mongo_query (options, ...args) {
		if (!this.options.query_logger) {
			return;
		}
		this._log_mongo_query_to_logger(this.options.query_logger, options, args);
	}

	_log_mongo_query_to_logger (logger, options, ...args) {
		let {
			error = null,
			query = {},
			time = 0,
			mongo_func = '???',
			request_id = 'NOREQ',
			query_options = {},
			no_slow = false
		} = options;
		let query_string = this._json_stringify(query);
		let options_string = this._json_stringify(query_options);
		let additional_arguments_string = this._json_stringify(args || {});
		let full_query = `${request_id} db.${this.db_collection.collectionName}.${mongo_func}(${query_string},${options_string},${additional_arguments_string})`;
		logger.log(`${full_query}|${time}|${error}`);
		if (
			!no_slow &&
			this.options.slow_logger &&
			this.options.slow_logger.slow_threshold &&
			time >= this.options.slow_logger.slow_threshold
		) {
			delete options.no_slow;
			this._log_mongo_query_to_logger(this.options.slow_logger, Object.assign({}, options, {no_slow: true}), args);
		}
		if (
			!no_slow &&
			this.options.really_slow_logger &&
			this.options.really_slow_logger.slow_threshold &&
			time >= this.options.really_slow_logger.slow_threshold
		) {
			delete options.no_slow;
			this._log_mongo_query_to_logger(this.options.really_slow_logger, Object.assign({}, options, {no_slow: true}), args);
		}
	}

	object_id_safe (id) {
		try {
			id = ObjectID(id);
		}
		catch(error) {
			return null;
		}
		return id;
	}

	create_id () {
		return ObjectID();
	}

	_id_stringify_result (error, result, callback) {
		if (error) {
			return callback(this.error_handler.data_error(error));
		}
		this._id_stringify(result, callback);
	}

	_id_stringify (object, callback) {
		if (object instanceof Array) {
			this._id_stringify_async(object, callback);
		}
		else if (object && typeof object === 'object') {
			if (object[this.id_attribute]) {
				object[this.id_attribute] = object[this.id_attribute].toString();
			}
			return process.nextTick(() => {
				callback(null, object);
			});
		}
		else {
			return callback(null, object);
		}
	}

	_id_stringify_async (objects, callback) {
		Bound_Async.forEachLimit(
			this,
			objects,
			100,
			this._id_stringify,
			() => {
				callback(null, objects);
			}
		);
	}
}

module.exports = Mongo_Collection;
