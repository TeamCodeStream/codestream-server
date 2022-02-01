// Provides a mongo client wrapper to the node mongo driver
// Establishes a set of MongoCollection objects that are directly mapped to the
// underlying Collection object from the mongo driver
// Also manages query logging

'use strict';

const MongoDbClient = require('mongodb').MongoClient;
const MongoCollection = require('./mongo_collection');
const MockMongoCollection = require('./mock_mongo_collection');
//const SimpleFileLogger = require('../simple_file_logger');
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
		this.establishQueryLogger();	// establish query logging if requested
		await this.connectToMongo();	// connect to the mongo service
		await this.makeCollections();	// make our collection mappings
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
		if (!this.options.queryLogging || this.options.queryLogging.disabled) {
			return;
		}
		this.queryLogger = this.options.logger;

		/*
		this.queryLogger = new SimpleFileLogger({ ...this.options.queryLogging, loggerId });
		if (this.options.queryLogging.slowBasename) {
			const slowConfig = Object.assign(this.options.queryLogging, {
				basename: this.options.queryLogging.slowBasename,
				slowThreshold: this.options.queryLogging.slowThreshold || 100,
				loggerId
			});
			this.slowLogger = new SimpleFileLogger(slowConfig);
		}
		if (this.options.queryLogging.reallySlowBasename) {
			const reallySlowConfig = Object.assign(this.options.queryLogging, {
				basename: this.options.queryLogging.reallySlowBasename,
				slowThreshold: this.options.queryLogging.reallySlowThreshold || 1000,
				loggerId
			});
			this.reallySlowLogger = new SimpleFileLogger(reallySlowConfig);
		}
		*/
	}

	// connect to the mongo service according to configuration
	async connectToMongo () {
		if (!this.config) {
			throw 'mongo configuration required';
		}
		if (this.options.mockMode) {
			if (this.options.logger) {
				this.options.logger.log('Note - mongo client has been opened in mock mode');
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
			if (this.options.logger) {
				this.options.logger.log(`Connecting to mongo: ${this.config.url}`);
			}
			const settings = Object.assign({}, this.config.settings, {
				useNewUrlParser: true,
				useUnifiedTopology: true
			});
			if (process.env.CSSVC_MONGO_CLIENT_CERT_FILE) {
				settings.tls = true;
				settings.tlsCAFile = process.env.CSSVC_MONGO_CLIENT_CERT_FILE
			}
			else {
				Object.assign(settings, this.config.tlsOptions);
			};
			if (this.options.tryIndefinitely) {
				await TryIndefinitely(async () => {
					this.mongoClient = await MongoDbClient.connect(
						this.config.url,
						settings
					);
					this.mongoClient.on('serverHeartbeatFailed', () => {
						if (this.options.logger) {
							this.options.logger.warn('Mongo server heartbeat failed');
						}
					});
				}, 5000, this.options.logger, 'Unable to connect to Mongo, retrying...');
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
		let collections = [];
		if (!this.options.collections || this.options.collections === 'all') {
			collections = await this.mongoClient.db().listCollections().toArray();
			collections = collections.map(c => c.name);
		}
		else if (this.options.collections instanceof Array) {
			let configCollections = [...this.options.collections];
			const allIndex = configCollections.indexOf('__all');
			if (allIndex !== -1) {
				configCollections.splice(allIndex, 1);
				collections = await this.mongoClient.db().listCollections().toArray();
				collections = collections.map(c => c.name);
			}
			collections = [...collections, ...configCollections];
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
		if (this.options.mockMode) {
			this.dbCollections[collection] = new MockMongoCollection({ collectionName: collection });
		}
		else {
			this.dbCollections[collection] = this.mongoClient.db().collection(collection);
		}
		this.mongoCollections[collection] = new MongoCollection({
			dbCollection: this.dbCollections[collection],
			queryLogger: this.queryLogger,
			/*
			slowLogger: this.slowLogger,
			reallySlowLogger: this.reallySlowLogger,
			*/
			hintsRequired: this.options.hintsRequired,
			noLogData: (this.options.queryLogging || {}).noLogData,
			mockMode: this.options.mockMode
		});
	}

	clearMockCache () {
		if (this.options.mockMode) {
			for (let dbCollection in this.dbCollections) {
				this.dbCollections[dbCollection].clearCache();
			}
		}
	}
}

module.exports = MongoClient;
