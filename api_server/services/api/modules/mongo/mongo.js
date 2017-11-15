'use strict';

var APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
var MongoClient = require(process.env.CS_API_TOP + '/lib/util/mongo/mongo_client.js');

const DEPENDENCIES = [
	'access_logger'
];

class Mongo extends APIServerModule {

	constructor (config) {
		super(config);
		this.mongoClientFactory = new MongoClient();
	}

	getDependencies () {
		return DEPENDENCIES;
	}

	services () {
		return (callback) => {
			if (!this.api.config.mongo) {
				this.api.warn('Will not connect to mongo, no mongo configuration supplied');
				return process.nextTick(callback);
			}
			const mongoOptions = Object.assign({}, this.api.config.mongo, {
				logger: this.api
			});
			if (mongoOptions.queryLogging && this.api.loggerId) {
				mongoOptions.queryLogging.loggerId = this.api.loggerId;
				mongoOptions.queryLogging.loggerHost = this.api.config.express.host || 'localhost';
			}
			this.mongoClientFactory.openMongoClient(
				mongoOptions,
				(error, mongoClient) => {
					if (error) { return callback(error); }
					this.mongoClient = mongoClient;
					return callback(null, [{ mongoClient: mongoClient }]);
				}
			);
		};
	}

	dataSources () {
		return () => {
			return this.mongoClient.mongoCollections;
		};
	}
}

module.exports = Mongo;
