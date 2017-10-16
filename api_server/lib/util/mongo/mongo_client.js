'use strict';

var Bound_Async = require(process.env.CS_API_TOP + '/lib/util/bound_async');
var MongoClient = require('mongodb').MongoClient;
var Mongo_Collection = require('./mongo_collection');
var Simple_File_Logger = require(process.env.CS_API_TOP + '/lib/util/simple_file_logger');

class Mongo_Client {

	constructor () {
		this.db_collections = {};
		this.mongo_collections = {};
	}

	open_mongo_client (config, callback) {
		this.config = config;
		Bound_Async.series(this, [
			this.establish_query_logger_as_needed,
			this.connect_to_mongo,
			this.make_collections
		], (error) => {
			callback(error, this);
		});
	}

	establish_query_logger_as_needed (callback) {
		if (this.config.query_logging) {
			this.establish_query_logger(callback);
		}
		else {
			callback();
		}
	}

	establish_query_logger (callback) {
		this.config.query_logger = new Simple_File_Logger(this.config.query_logging);
		if (this.config.query_logging.slow_basename) {
			const slow_config = Object.assign(this.config.query_logging, {
				basename: this.config.query_logging.slow_basename,
				slow_threshold: this.config.query_logging.slow_threshold || 100
			});
			this.config.slow_logger = new Simple_File_Logger(slow_config);
		}
		if (this.config.query_logging.really_slow_basename) {
			const really_slow_config = Object.assign(this.config.query_logging, {
				basename: this.config.query_logging.really_slow_basename,
				slow_threshold: this.config.query_logging.really_slow_threshold || 1000
			});
			this.config.really_slow_logger = new Simple_File_Logger(really_slow_config);
		}
		callback();
	}

	connect_to_mongo (callback) {
		if (!this.config) {
			return callback('mongo configuration required');
		}
		if (!this.config.url) {
			const host = this.config.host || '127.0.0.1';
			const port = this.config.port || 27017;
			if (!this.config.database) {
				return callback('mongo configuration needs database');
			}
			this.config.url = `mongodb://${host}:${port}/${this.config.database}`;
		}

		try {
			if (this.config.logger) {
				this.config.logger.log(`Connecting to mongo: ${this.config.url}`);
			}
			MongoClient.connect(
				this.config.url,
				this.config.settings || {},
				(error, db) => {
					if (error) {
						return callback(`could not connect: ${error}`);
					}
					this.db = db;
					process.nextTick(callback);
				}
			);
		}
		catch(error) {
			callback('exception thrown connecting: ' + error);
		}
	}

	make_collections (callback) {
		if (!this.config.collections || !(this.config.collections instanceof Array)) {
			return process.nextTick(callback);
		}
		Bound_Async.forEachLimit(
			this,
			this.config.collections,
			10,
			this.make_collection,
			callback
		);
	}

	make_collection (collection, callback) {
		if (typeof collection !== 'string') { return process.nextTick(callback); }
		this.db_collections[collection] = this.db.collection(collection);
		this.mongo_collections[collection] = new Mongo_Collection({
			db_collection: this.db_collections[collection],
			query_logger: this.config.query_logger,
			slow_logger: this.config.slow_logger,
			really_slow_logger: this.config.really_slow_logger
		});
		process.nextTick(callback);
	}
}

module.exports = Mongo_Client;
