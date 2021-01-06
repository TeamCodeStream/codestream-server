#!/usr/bin/env node

// Main executable for running the CodeStream API Server
//
// We'll load a bunch of configurations and then use a "generic" API server to do most of the work

'use strict';

// load configurations
const ApiConfig = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/config/config');
const ModuleDirectory = process.env.CSSVC_BACKEND_ROOT + '/api_server/modules';
const SimpleFileLogger = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/cluster_wrapper');
const StringifySortReplacer = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/stringify_sort_replacer');
const ServerClass = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_server');
const getOnPremSupportData = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/get_onprem_support_data');

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
	reposByCommitHash: require(ModuleDirectory + '/repos/repo_by_commit_hash')
};

// establish our mongo collections, these include our DataCollections, but 
// may also include other collections that we speak to directly
// through mongo, we don't abstract them out into DataCollections
const MongoCollections = Object.keys(DataCollections).concat([
	'signupTokens',
	'versionMatrix',
	'migrationVersion',
	'test',
	'phoneHomeJobs',
	'phoneHomeStats'
]);

(async function() {
	// changes to Config will be available globally via the /config/writeable.js module
	const Config = await ApiConfig.loadPreferredConfig();

	// establish our logger
	const Logger = new SimpleFileLogger(Config.apiServer.logger);

	// onprem support data (service versions, docker registry info, on-prem version)
	let onPremSupportData;
	if (!Config.adminServer.adminServerDisabled) {
		onPremSupportData = await getOnPremSupportData(Logger);
		console.info('OnPrem Config:', JSON.stringify(onPremSupportData, StringifySortReplacer, 8));
	}

	// invoke a node cluster master with our configurations provided
	const MyAPICluster = new ClusterWrapper(
		ServerClass,
		{
			config: Config,
			logger: Logger, // the logger passed to the constructed API Server
			moduleDirectory: ModuleDirectory,
			dataCollections: DataCollections,
			rawCollections: MongoCollections,
			onprem: onPremSupportData
		},
		{
			logger: Logger, // the logger used by ClusterWrapper itself
			oneWorker: Config.apiServer.mockMode
		}
	);
	try {
		await MyAPICluster.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
