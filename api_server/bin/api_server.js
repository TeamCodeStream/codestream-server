#!/usr/bin/env node

// Main executable for running the CodeStream API Server
//
// We'll load a bunch of configurations and then use a "generic" API server to do most of the work

'use strict';

// load configurations
const ApiConfig = require(process.env.CS_API_TOP + '/config/config');
const ModuleDirectory = process.env.CS_API_TOP + '/modules';
const SimpleFileLogger = require(process.env.CS_API_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_API_TOP + '/server_utils/cluster_wrapper');
const ServerClass = require(process.env.CS_API_TOP + '/lib/api_server/api_server');

// establish our data collections
const DataCollections = {
	users: require(ModuleDirectory + '/users/user'),
	companies: require(ModuleDirectory + '/companies/company'),
	teams: require(ModuleDirectory + '/teams/team'),
	repos: require(ModuleDirectory + '/repos/repo'),
	streams: require(ModuleDirectory + '/streams/stream'),
	posts: require(ModuleDirectory + '/posts/post'),
	markers: require(ModuleDirectory + '/markers/marker'),
	codemarks: require(ModuleDirectory + '/codemarks/codemark'),
	reviews: require(ModuleDirectory + '/reviews/review'),
	markerLocations: require(ModuleDirectory + '/marker_locations/marker_locations'),
	providerPosts: require(ModuleDirectory + '/provider_posts/provider_post'),
	codemarkLinks: require(ModuleDirectory + '/codemarks/codemark_link'),
	msteams_conversations: require(ModuleDirectory + '/msteams_conversations/msteams_conversation'),
	msteams_states: require(ModuleDirectory + '/msteams_states/msteams_state'),
	msteams_teams: require(ModuleDirectory + '/msteams_teams/msteams_team'),
};

// establish our mongo collections, these include our DataCollections, but 
// may also include other collections that we speak to directly
// through mongo, we don't abstract them out into DataCollections
const MongoCollections = Object.keys(DataCollections).concat([
	'signupTokens',
	'versionMatrix',
	'migrationVersion',
	'test'
]);

(async function() {
	// changes to Config will be available globally via the /config/writeable.js module
	const Config = await ApiConfig.loadConfig({custom: true});

	// establish our logger
	const Logger = new SimpleFileLogger(Config.loggerConfig);

	// FIXME: this copies the initial config into a new structure so it won't be
	//        in sync with any config refreshes that happen further down the
	//        road nor will you be able to fetch it by requring '/config/config'.
	if (Config.mongo.queryLogging) {
		Object.assign(Config.mongo.queryLogging, Config.loggerConfig, Config.mongo.queryLogging);
	}
	Config.mongo.collections = MongoCollections;
	Config.mongo.logger = Logger;

	// invoke a node cluster master with our configurations provided
	const MyAPICluster = new ClusterWrapper(
		ServerClass,
		{
			...Config,
			moduleDirectory: ModuleDirectory,
			dataCollections: DataCollections
		},
		Logger
	);
	try {
		await MyAPICluster.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
