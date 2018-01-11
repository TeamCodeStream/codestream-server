// Provides a mongo client wrapper to the node mongo driver
// Establishes a set of MongoCollection objects that are directly mapped to the
// underlying Collection object from the mongo driver
// Also manages query logging

'use strict';

var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
var MongoDbClient = require('mongodb').MongoClient;
var MongoCollection = require('./mongo_collection');
var SimpleFileLogger = require(process.env.CS_API_TOP + '/server_utils/simple_file_logger');

class MongoClient {

	constructor () {
		this.dbCollections = {};
		this.mongoCollections = {};
	}

	// open and initialize the mongo client
	openMongoClient (config, callback) {
		this.config = config;
		BoundAsync.series(this, [
			this.establishQueryLoggerAsNeeded,	// establish query logging if requested
			this.connectToMongo,				// connect to the mongo service
			this.makeCollections				// make our collection mappings
		], (error) => {
			callback(error, this);
		});
	}

	// establish our query logger as needed
	establishQueryLoggerAsNeeded (callback) {
		if (this.config.queryLogging) {
			this.establishQueryLogger(callback);
		}
		else {
			callback();
		}
	}

	// establish the query logger ... in addition to logging all queries, we can also
	// log slow queries and really slow queries according to threshold settings
	establishQueryLogger (callback) {
		this.config.queryLogger = new SimpleFileLogger(this.config.queryLogging);
		if (this.config.queryLogging.slowBasename) {
			const slowConfig = Object.assign(this.config.queryLogging, {
				basename: this.config.queryLogging.slowBasename,
				slowThreshold: this.config.queryLogging.slowThreshold || 100
			});
			this.config.slowLogger = new SimpleFileLogger(slowConfig);
		}
		if (this.config.queryLogging.reallySlowBasename) {
			const reallySlowConfig = Object.assign(this.config.queryLogging, {
				basename: this.config.queryLogging.reallySlowBasename,
				slowThreshold: this.config.queryLogging.reallySlowThreshold || 1000
			});
			this.config.reallySlowLogger = new SimpleFileLogger(reallySlowConfig);
		}
		callback();
	}

	// connect to the mongo service according to configuration
	connectToMongo (callback) {
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
			MongoDbClient.connect(
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

	// for each desired database collection, create a MongoCollection object as a bridge
	makeCollections (callback) {
		if (!this.config.collections || !(this.config.collections instanceof Array)) {
			return process.nextTick(callback);
		}
		BoundAsync.forEachLimit(
			this,
			this.config.collections,
			10,
			this.makeCollection,
			callback
		);
	}

	// create a single MongoCollection object as a bridge to the mongo driver's Collection object
	makeCollection (collection, callback) {
		if (typeof collection !== 'string') { return process.nextTick(callback); }
		this.dbCollections[collection] = this.db.collection(collection);
		this.mongoCollections[collection] = new MongoCollection({
			dbCollection: this.dbCollections[collection],
			queryLogger: this.config.queryLogger,
			slowLogger: this.config.slowLogger,
			reallySlowLogger: this.config.reallySlowLogger,
			hintsRequired: this.config.hintsRequired
		});
		process.nextTick(callback);
	}
}

module.exports = MongoClient;
