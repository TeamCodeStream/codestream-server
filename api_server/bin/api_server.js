#!/usr/bin/env node

// Main executable for running the CodeStream API Server
//
// We'll load a bunch of configurations and then use a "generic" API server to do most of the work

'use strict';

// load configurations
const ConfigDirectory = process.env.CS_API_TOP + '/config';
const ModuleDirectory = process.env.CS_API_TOP + '/modules';
const ApiConfig = require(ConfigDirectory + '/api.js');
const ExpressConfig = require(ConfigDirectory + '/express.js');
const MongoConfig = require(ConfigDirectory + '/mongo.js');
const SecretsConfig = require(ConfigDirectory + '/secrets.js');
const PubNubConfig = require(ConfigDirectory + '/pubnub.js');
const MixPanelConfig = require(ConfigDirectory + '/mixpanel.js');
const SlackConfig = require(ConfigDirectory + '/slack.js');
const LoggerConfig = require(ConfigDirectory + '/logger.js');
const EmailConfig = require(ConfigDirectory + '/email.js');
const AWSConfig = require(ConfigDirectory + '/aws.js');
const Limits = require(ConfigDirectory + '/limits.js');
const Version = require(ConfigDirectory + '/version.js');
const SimpleFileLogger = require(process.env.CS_API_TOP + '/server_utils/simple_file_logger');
var ClusterWrapper = require(process.env.CS_API_TOP + '/server_utils/cluster_wrapper');

// establish our logger
var Logger = new SimpleFileLogger(LoggerConfig);

if (MongoConfig.queryLogging) {
	// we maintain a separate log file for mongo queries
	Object.assign(MongoConfig.queryLogging, LoggerConfig, MongoConfig.queryLogging);
}

// establish our data collections
const DataCollections = {
	users: require(ModuleDirectory + '/users/user'),
	companies: require(ModuleDirectory + '/companies/company'),
	teams: require(ModuleDirectory + '/teams/team'),
	repos: require(ModuleDirectory + '/repos/repo'),
	streams: require(ModuleDirectory + '/streams/stream'),
	posts: require(ModuleDirectory + '/posts/post'),
	markers: require(ModuleDirectory + '/markers/marker'),
	markerLocations: require(ModuleDirectory + '/marker_locations/marker_locations')
};
const MongoCollections = Object.keys(DataCollections);

// invoke a node cluster master with our configurations provided
var ServerClass = require(process.env.CS_API_TOP + '/lib/api_server/api_server');
var MyAPICluster = new ClusterWrapper(
	ServerClass,
	{
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
		mixpanel: MixPanelConfig,
		slack: SlackConfig,
		email: EmailConfig,
		aws: AWSConfig,
		limits: Limits,
		allowConfigOverride: true,
		dataCollections: DataCollections,
		logger: Logger
	},
	Logger
);

// start up the master, this will launch workers to really get down to work
MyAPICluster.start((error) => {
	if (error) {
		console.error('Failed to start: ' + error);
		process.exit(1);
	}
});
