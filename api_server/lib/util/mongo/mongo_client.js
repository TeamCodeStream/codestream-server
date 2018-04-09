// Provides a mongo client wrapper to the node mongo driver
// Establishes a set of MongoCollection objects that are directly mapped to the
// underlying Collection object from the mongo driver
// Also manages query logging

'use strict';

const MongoDbClient = require('mongodb').MongoClient;
const MongoCollection = require('./mongo_collection');
const SimpleFileLogger = require(process.env.CS_API_TOP + '/server_utils/simple_file_logger');

class MongoClient {

	constructor () {
		this.dbCollections = {};
		this.mongoCollections = {};
	}

	// open and initialize the mongo client
	async openMongoClient (config) {
		this.config = config;
		if (this.config.queryLogging) {				// establish query logging if requested
			this.establishQueryLogger();
		}
		await this.connectToMongo();				// connect to the mongo service
		await this.makeCollections();				// make our collection mappings
		return this;
	}

	// establish the query logger ... in addition to logging all queries, we can also
	// log slow queries and really slow queries according to threshold settings
	establishQueryLogger () {
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
	}

	// connect to the mongo service according to configuration
	async connectToMongo () {
		if (!this.config) {
			throw 'mongo configuration required';
		}
		if (!this.config.url) {
			const host = this.config.host || '127.0.0.1';
			const port = this.config.port || 27017;
			if (!this.config.database) {
				throw 'mongo configuration needs database';
			}
			this.config.url = `mongodb://${host}:${port}/${this.config.database}`;
		}

		try {
			if (this.config.logger) {
				this.config.logger.log(`Connecting to mongo: ${this.config.url}`);
			}
			this.db = await MongoDbClient.connect(
				this.config.url,
				this.config.settings || {}
			);
		}
		catch (error) {
			throw 'could not connect to mongo: ' + error;
		}
	}

	// for each desired database collection, create a MongoCollection object as a bridge
	async makeCollections () {
		if (!this.config.collections || !(this.config.collections instanceof Array)) {
			return;
		}
		await Promise.all(this.config.collections.map(async collection => {
			await this.makeCollection(collection);
		}));
	}

	// create a single MongoCollection object as a bridge to the mongo driver's Collection object
	async makeCollection (collection) {
		if (typeof collection !== 'string') { return; }
		this.dbCollections[collection] = this.db.collection(collection);
		this.mongoCollections[collection] = new MongoCollection({
			dbCollection: this.dbCollections[collection],
			queryLogger: this.config.queryLogger,
			slowLogger: this.config.slowLogger,
			reallySlowLogger: this.config.reallySlowLogger,
			hintsRequired: this.config.hintsRequired
		});
	}
}

module.exports = MongoClient;
