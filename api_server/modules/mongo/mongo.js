// provides a service to the API server, making mongo available for data storage
// also provides the mongo collections (according to configuration) available as a data source

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const MongoClient = require(process.env.CS_API_TOP + '/server_utils/mongo/mongo_client.js');

const DEPENDENCIES = [
	'access_logger'	// since we do query logging, we need the access logger module
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
		// return a function that, when invoked, will return a service structure with our
		// mongo client as a service to the API server app
		return async () => {
			if (!this.api.config.mongo) {
				this.api.warn('Will not connect to mongo, no mongo configuration supplied');
				return;
			}
			const mongoOptions = Object.assign({}, this.api.config.mongo, {
				logger: this.api
			});
			if (mongoOptions.queryLogging && this.api.loggerId) {
				mongoOptions.queryLogging.loggerId = this.api.loggerId;
				mongoOptions.queryLogging.loggerHost = this.api.config.express.host || 'localhost';
			}
			this.mongoClient = await this.mongoClientFactory.openMongoClient(mongoOptions);
			return { mongoClient: this.mongoClient };
		};
	}

	dataSources () {
		// return the mongo collections as a data source, for implementation-immune reading and writing of data
		return () => {
			return this.mongoClient.mongoCollections;
		};
	}
}

module.exports = Mongo;
