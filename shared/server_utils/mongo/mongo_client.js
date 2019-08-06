// Provides a mongo client wrapper to the node mongo driver
// Establishes a set of MongoCollection objects that are directly mapped to the
// underlying Collection object from the mongo driver
// Also manages query logging

'use strict';

const MongoDbClient = require('mongodb').MongoClient;
const MongoCollection = require('./mongo_collection');
const MockMongoCollection = require('./mock_mongo_collection');
const SimpleFileLogger = require('../simple_file_logger');
const TryIndefinitely = require('../try_indefinitely');

class MongoClient {

	constructor (options = {}) {
		this.options = options;
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

	async close () {
		if (this.mongoClient) {
			await this.mongoClient.close();
		}
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
		if (this.config.mockMode) {
			if (this.config.logger) {
				this.config.logger.log('Note - mongo client has been opened in mock mode');
			}
			return;
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
			const settings = Object.assign({}, this.config.settings, { useNewUrlParser: true });
			if (this.options.tryIndefinitely) {
				await TryIndefinitely(async () => {
					this.mongoClient = await MongoDbClient.connect(
						this.config.url,
						settings
					);
				}, 5000, this.config.logger, 'Unable to connect to Mongo, retrying...');
			}
			else {
				this.mongoClient = await MongoDbClient.connect(
					this.config.url,
					settings
				);
			}
		}
		catch (error) {
			throw 'could not connect to mongo: ' + error;
		}
	}

	// for each desired database collection, create a MongoCollection object as a bridge
	async makeCollections () {
		let collections;
		if (this.config.collections === 'all') {
			collections = await this.mongoClient.db().listCollections().toArray();
			collections = collections.map(c => c.name);
		}
		else if (this.config.collections instanceof Array) {
			collections = this.config.collections;
		}
		else {
			return;
		}

		await Promise.all(collections.map(async collection => {
			await this.makeCollection(collection);
		}));
	}

	// create a single MongoCollection object as a bridge to the mongo driver's Collection object
	async makeCollection (collection) {
		if (typeof collection !== 'string') { return; }
		if (this.config.mockMode) {
			this.dbCollections[collection] = new MockMongoCollection({ collectionName: collection });
		}
		else {
			this.dbCollections[collection] = this.mongoClient.db().collection(collection);
		}
		this.mongoCollections[collection] = new MongoCollection({
			dbCollection: this.dbCollections[collection],
			queryLogger: this.config.queryLogger,
			slowLogger: this.config.slowLogger,
			reallySlowLogger: this.config.reallySlowLogger,
			hintsRequired: this.config.hintsRequired,
			noLogData: (this.config.queryLogging || {}).noLogData
		});
	}

	clearMockCache () {
		if (this.config.mockMode) {
			for (let dbCollection in this.dbCollections) {
				this.dbCollections[dbCollection].clearCache();
			}
		}
	}
}

module.exports = MongoClient;
