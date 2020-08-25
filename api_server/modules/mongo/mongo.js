// provides a service to the API server, making mongo available for data storage
// also provides the mongo collections (according to configuration) available as a data source

'use strict';

const APIServerModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server_module.js');
const MongoClient = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/mongo/mongo_client.js');

const DEPENDENCIES = [
	'access_logger'	// since we do query logging, we need the access logger module
];

const ROUTES = [
	{
		method: 'delete',
		path: 'no-auth/--clear-mock-cache',
		func: 'handleClearMockCache'
	}
];

class Mongo extends APIServerModule {

	getDependencies () {
		return DEPENDENCIES;
	}

	getRoutes () {
		return ROUTES;
	}

	services () {
		// return a function that, when invoked, will return a service structure with our
		// mongo client as a service to the API server app
		return async () => {
			if (!this.api.config.storage.mongo) {
				this.api.warn('Will not connect to mongo, no mongo configuration supplied');
				return;
			}
			this.mongoClientFactory = new MongoClient({
				tryIndefinitely: true,
				mockMode: this.api.config.apiServer.mockMode,
				logger: this.api.logger,
				queryLogging: this.api.config.storage.mongo.queryLogging,
				collections: this.api.serverOptions.rawCollections
			});
			this.mongoClient = await this.mongoClientFactory.openMongoClient(this.api.config.storage.mongo);
			return { mongoClient: this.mongoClient };
		};
	}

	dataSources () {
		// return the mongo collections as a data source, for implementation-immune reading and writing of data
		return () => {
			return this.mongoClient.mongoCollections;
		};
	}

	handleClearMockCache (request, response) {
		if (this.api.config.apiServer.mockMode) {
			this.mongoClient.clearMockCache();
			response.status(200).send({});
		}
		else {
			response.status(401).send('NOT IN MOCK MODE');
		}
	}
}

module.exports = Mongo;
