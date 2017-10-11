'use strict';

var API_Server_Module = require(process.env.CI_API_TOP + '/lib/api_server/api_server_module.js');
var Mongo_Client = require(process.env.CI_API_TOP + '/lib/util/mongo/mongo_client.js');

const DEPENDENCIES = [
	'access_logger'
];

class Mongo extends API_Server_Module {

	constructor (config) {
		super(config);
		this.mongo_client_factory = new Mongo_Client();
	}

	get_dependencies () {
		return DEPENDENCIES;
	}

	services () {
		return (callback) => {
			if (!this.api.config.mongo) {
				this.api.warn('Will not connect to mongo, no mongo configuration supplied');
				return process.nextTick(callback);
			}
			const mongo_options = Object.assign({}, this.api.config.mongo, {
				logger: this.api
			});
			if (mongo_options.query_logging && this.api.logger_id) {
				mongo_options.query_logging.logger_id = this.api.logger_id;
				mongo_options.query_logging.logger_host = this.api.config.express.host || 'localhost';
			}
			this.mongo_client_factory.open_mongo_client(
				mongo_options,
				(error, mongo_client) => {
					if (error) { return callback(error); }
					this.mongo_client = mongo_client;
					return callback(null, [{ mongo_client: mongo_client }]);
				}
			);
		};
	}

	data_sources () {
		return () => {
			return this.mongo_client.mongo_collections;
		};
	}
}

module.exports = Mongo;
