#!/usr/bin/env node
'use strict';

var APICluster = require(process.env.CS_API_TOP + '/lib/api_server/api_cluster.js');
const ConfigDirectory = process.env.CS_API_TOP + '/config';
const ModuleDirectory = process.env.CS_API_TOP + '/services/api/modules';
const ApiConfig = require(ConfigDirectory + '/api.js');
const ExpressConfig = require(ConfigDirectory + '/express.js');
const MongoConfig = require(ConfigDirectory + '/mongo.js');
const SecretsConfig = require(ConfigDirectory + '/secrets.js');
const PubNubConfig = require(ConfigDirectory + '/pubnub.js');
const LoggerConfig = require(ConfigDirectory + '/logger.js');
const EmailConfig = require(ConfigDirectory + '/email.js');
const Limits = require(ConfigDirectory + '/limits.js');
const Version = require(ConfigDirectory + '/version.js');
const SimpleFileLogger = require(process.env.CS_API_TOP + '/lib/util/simple_file_logger');

var Logger = new SimpleFileLogger(LoggerConfig);

if (MongoConfig.queryLogging) {
	Object.assign(MongoConfig.queryLogging, LoggerConfig, MongoConfig.queryLogging);
}

const DataCollections = {
	users: require(ModuleDirectory + '/users/user'),
	companies: require(ModuleDirectory + '/companies/company'),
	teams: require(ModuleDirectory + '/teams/team'),
	repos: require(ModuleDirectory + '/repos/repo'),
	streams: require(ModuleDirectory + '/streams/stream'),
	posts: require(ModuleDirectory + '/posts/post')
};
const MongoCollections = Object.keys(DataCollections);

var MyAPICluster = new APICluster({
	moduleDirectory: ModuleDirectory,
	api: ApiConfig,
	version: Version,
	secrets: SecretsConfig,
	express: ExpressConfig,
	mongo: Object.assign(MongoConfig, {
		collections: MongoCollections,
		logger: Logger
	}),
	pubnub: PubNubConfig,
	email: EmailConfig,
	logger: Logger,
	limits: Limits,
	allowConfigOverride: true,
	dataCollections: DataCollections
}, Logger);

MyAPICluster.start((error) => {
	if (error) {
		console.error('Failed to start: ' + error);
		process.exit(1);
	}
});
