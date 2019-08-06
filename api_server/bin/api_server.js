#!/usr/bin/env node

// Main executable for running the CodeStream API Server
//
// We'll load a bunch of configurations and then use a "generic" API server to do most of the work

'use strict';

// load configurations
const ConfigDirectory = process.env.CS_API_TOP + '/config';
const ModuleDirectory = process.env.CS_API_TOP + '/modules';
const ApiConfig = require(ConfigDirectory + '/api');
const ExpressConfig = require(ConfigDirectory + '/express');
const MongoConfig = require(ConfigDirectory + '/mongo');
const SecretsConfig = require(ConfigDirectory + '/secrets');
const PubNubConfig = require(ConfigDirectory + '/pubnub');
const SocketClusterConfig = require(ConfigDirectory + '/socketcluster');
const IpcConfig = require(ConfigDirectory + '/ipc');
const SegmentConfig = require(ConfigDirectory + '/segment');
const SlackConfig = require(ConfigDirectory + '/slack');
const MSTeamsConfig = require(ConfigDirectory + '/msteams');
const GlipConfig = require(ConfigDirectory + '/glip');
const GithubConfig = require(ConfigDirectory + '/github');
const GithubEnterpriseConfig = require(ConfigDirectory + '/github_enterprise');
const AsanaConfig = require(ConfigDirectory + '/asana');
const TrelloConfig = require(ConfigDirectory + '/trello');
const JiraConfig = require(ConfigDirectory + '/jira');
const JiraServerConfig = require(ConfigDirectory + '/jiraserver');
const BitbucketConfig = require(ConfigDirectory + '/bitbucket');
const GitlabConfig = require(ConfigDirectory + '/gitlab');
const YouTrackConfig = require(ConfigDirectory + '/youtrack');
const AzureDevOpsConfig = require(ConfigDirectory + '/azuredevops');
const LoggerConfig = require(ConfigDirectory + '/logger');
const EmailConfig = require(ConfigDirectory + '/email');
const AWSConfig = require(ConfigDirectory + '/aws');
const RabbitMQConfig = require(ConfigDirectory + '/rabbitmq');
const WebClientConfig = require(ConfigDirectory + '/webclient');
const Limits = require(ConfigDirectory + '/limits');
const SimpleFileLogger = require(process.env.CS_API_TOP + '/server_utils/simple_file_logger');
const ClusterWrapper = require(process.env.CS_API_TOP + '/server_utils/cluster_wrapper');

// establish our logger
const Logger = new SimpleFileLogger(LoggerConfig);

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
	codemarks: require(ModuleDirectory + '/codemarks/codemark'),
	markerLocations: require(ModuleDirectory + '/marker_locations/marker_locations'),
	providerPosts: require(ModuleDirectory + '/provider_posts/provider_post'),
	codemarkLinks: require(ModuleDirectory + '/codemarks/codemark_link')
};

// establish our mongo collections, these include our DataCollections, but 
// may also include other collections that we speak to directly
// through mongo, we don't abstract them out into DataCollections
const MongoCollections = Object.keys(DataCollections).concat([
	'signupTokens',
	'versionMatrix',
	'migrationVersion'
]);

// invoke a node cluster master with our configurations provided
const ServerClass = require(process.env.CS_API_TOP + '/lib/api_server/api_server');
const MyAPICluster = new ClusterWrapper(
	ServerClass,
	{
		moduleDirectory: ModuleDirectory,
		api: ApiConfig,
		secrets: SecretsConfig,
		express: ExpressConfig,
		mongo: Object.assign(MongoConfig, {
			collections: MongoCollections,
			logger: Logger
		}),
		pubnub: PubNubConfig,
		socketCluster: SocketClusterConfig,
		ipc: IpcConfig,
		segment: SegmentConfig,
		slack: SlackConfig,
		msteams: MSTeamsConfig,
		glip: GlipConfig,
		github: GithubConfig,
		github_enterprise: GithubEnterpriseConfig,
		asana: AsanaConfig,
		trello: TrelloConfig,
		jira: JiraConfig,
		jiraserver: JiraServerConfig,
		bitbucket: BitbucketConfig,
		gitlab: GitlabConfig,
		youtrack: YouTrackConfig,
		azuredevops: AzureDevOpsConfig,
		email: EmailConfig,
		aws: AWSConfig,
		rabbitmq: RabbitMQConfig,
		webclient: WebClientConfig,
		limits: Limits,
		dataCollections: DataCollections,
		logger: Logger
	},
	Logger
);


(async function() {
	try {
		await MyAPICluster.start();
	}
	catch (error) {
		console.error('Failed to start: ' + error); // eslint-disable-line no-console
		process.exit(1);
	}
})();
