// api configuration

'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('../codestream-configs/lib/structured_config'); 
const MongoUrlParser = require('../codestream-configs/lib/mongo_url_parser');

/*
	Returns: c = {
		whichBroadcastEngine: config section name of broadcast engine to use (string)
		pubnub: pubnub config taken directly from the config file (object)
		codestreamBroadcaster: config taken directly from the config file (object)
		socketCluster: broadcaster configuration derived from the config file (object)
	}
*/
function selectBroadcastEngine (nativeCfg) {
	const c = {
		whichBroadcastEngine: nativeCfg.broadcastEngine.selected,
		pubnub: nativeCfg.broadcastEngine.pubnub,
		codestreamBroadcaster: nativeCfg.broadcastEngine.codestreamBroadcaster,
		socketCluster: {}
	};
	if (!c.whichBroadcastEngine) {
		if (c.pubnub) {
			c.whichBroadcastEngine = 'pubnub';
		} else if (Object.keys(nativeCfg.broadcastEngine.codestreamBroadcaster).length != 0) {
			c.whichBroadcastEngine = 'codestreamBroadcaster';
		}
		else {
			console.error('cannot determine which broadcast engine to use');
			process.exit(1);
		}
	}
	else if (!nativeCfg.broadcastEngine[c.whichBroadcastEngine]) {
		console.error(`no config data for broadcast engine ${c.whichBroadcastEngine}`);
		process.exit(1);
	}

	if (c.whichBroadcastEngine === 'codestreamBroadcaster') {
		c.socketCluster = {
			host: nativeCfg.broadcastEngine.codestreamBroadcaster.host,
			port: nativeCfg.broadcastEngine.codestreamBroadcaster.port,
			authKey: nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api,
			ignoreHttps: nativeCfg.broadcastEngine.codestreamBroadcaster.ignoreHttps,
			strictSSL: nativeCfg.ssl.requireStrictSSL,
			apiSecret: nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api
		};
		Object.assign(c, {
			secrets: {
				broadcaster: nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api
			}
		});
	}
	return c;
}

// list of third-party providers available for integrations. Provider availability depends
// on the running configuration. Per-integration modules loaded as needed.
const ThirdPartyProviders = [
	'asana',
	'azuredevops',
	'bitbucket',
	'github',
	'github_enterprise',
	'gitlab',
	'gitlab_enterprise',
	'jira',
	'jiraserver',
	'msteams',
	'slack',
	'trello',
	'youtrack',
	'okta'
];

// eslint-disable-next-line complexity
function customConfigFunc(nativeCfg) {
	// creates a custom config object derived from the loaded native config
	const apiCfg = {
		api: {
			...nativeCfg.apiServer,
			runTimeEnvironment: nativeCfg.sharedGeneral.runTimeEnvironment,
			authOrigin: nativeCfg.apiServer.authOrigin || `${nativeCfg.apiServer.publicApiUrl}/no-auth`,
			thirdPartyProviders: ThirdPartyProviders,
			// matching these paths means Authorization header is not required
			unauthenticatedPaths: ['^\\/no-auth\\/', '^\\/robots\\.txt$'],
			// matching these paths means Authorization header is optional, behavior may vary
			optionalAuthenticatedPaths: ['^\\/help(\\/|$)', '^\\/c\\/', '^\\/p\\/', '^\\/r\\/', '^\\/web\\/'],
			// matching these paths means cookie authentication is required
			cookieAuthenticatedPaths: ['^\\/c\\/', '^\\/r\\/', '^\\/web\\/'],
			// server will use this cookie to store identity token
			identityCookie: 'tcs',
		},
		secrets: {
			...nativeCfg.sharedSecrets
		},
		express: {
			port: nativeCfg.apiServer.port,
			ignoreHttps: nativeCfg.apiServer.ignoreHttps,
			https: nativeCfg.ssl
		},
		ipc: {
			serverId: 'codestream_api_ipc_server',
			clientId: 'codestream_ipc_client'
		},
		segment: nativeCfg.telemetry.segment,
		slack: nativeCfg.integrations.slack.cloud || {},
		msteams: nativeCfg.integrations.msteams.cloud || {},
		github: nativeCfg.integrations.github.cloud || {},
		jira: nativeCfg.integrations.jira.cloud || {},
		asana: nativeCfg.integrations.asana.cloud || {},
		trello: nativeCfg.integrations.trello.cloud || {},
		bitbucket: nativeCfg.integrations.bitbucket.cloud || {},
		gitlab: nativeCfg.integrations.gitlab.cloud || {},
		azuredevops: nativeCfg.integrations.devops.cloud || {},
		okta: nativeCfg.integrations.okta.localInstallion || {},
		github_enterprise: {
			// this is needed to be non-null to return provider data to the
			// client, but is not actually used
			appClientId: 'placeholder'
		},
		gitlab_enterprise: nativeCfg.integrations.gitlab.cloud || {},
		jiraserver: {
			appClientId: 'placeholder'
		},
		youtrack: nativeCfg.integrations.youtrack.cloud || {
			appClientId: 'placeholder'
		},
		email: {
			...nativeCfg.email,
			inboundEmailDisabled: nativeCfg.inboundEmailServer.inboundEmailDisabled
		},
		aws: {
			// FIXME: JJ would prefer we don't set a default region at all
			region: 'us-east-1',
			sqs: {
				outboundEmailQueueName: null
			}
		},
		rabbitmq: nativeCfg.queuingEngine.rabbitmq,
		webclient: {
			marketingHost: nativeCfg.apiServer.marketingSiteUrl
		},
		limits: {
			maxPostsPerRequest: 100,    // never serve more than this many posts in a page
			maxStreamsPerRequest: 500,  // never serve more than this many streams in a page
			maxMarkersPerRequest: 100   // never serve more than this many markers in a page (not currently used)
		},
		loggerConfig: {
			...nativeCfg.apiServer.logger,
			basename: 'api',
			retentionPeriod: 30 * 24 * 60 * 60 * 1000,	// retain log files for this many milliseconds
			globalProperties: {
				environment: nativeCfg.sharedGeneral.runTimeEnvironment,
				service: 'api',
			}
		},
		mongo: {
			...nativeCfg.storage.mongo,
			database: MongoUrlParser(nativeCfg.storage.mongo.url).database,
			hintsRequired: true,
			// we write a separate log file for mongo queries, and for slow
			// and "really slow" queries so we can look for problems
			queryLogging: {
				disabled: false,            // set to true to disable query logging
				basename: 'mongo-query',
				slowBasename: 'slow-mongo-query',
				reallySlowBasename: 'really-slow-mongo-query',
				slowThreshold: 100,         // queries that take longer than this go to the slow query log
				reallySlowThreshold: 1000,  // queries that take longer than this go to the "really slow" query log
				// remove the fields below from query logging, replace with '*'
				noLogData: [
					{
						collection: 'posts',
						fields: ['text']
					},
					{
						collection: 'codemarks',
						fields: ['text', 'title']
					},
					{
						collection: 'markers',
						fields: ['code']
					},
					{
						collection: 'users',
						fields: ['providerInfo.*.*.accessToken', 'providerInfo.*.*.refreshToken', 'accessTokens.*.token', 'pubNubToken', 'broadcasterToken', 'modifiedRepos']
					},
					{
						collection: 'reviews',
						fields: ['reviewChangesets', 'reviewDiffs']
					}
				]
			}
		},
		intercom: {
			accessToken: nativeCfg.telemetry.intercom.token
		}
	};

	// broadcast engine config properties
	Object.assign(apiCfg, selectBroadcastEngine(nativeCfg));
	apiCfg.secrets.broadcaster = apiCfg.socketCluster.apiSecret;

	// Slack: for use with signing secrets
	if(nativeCfg.integrations.slack.cloud) {
		apiCfg.slack.signingSecretsByAppIds = {};
		apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appId] = apiCfg.slack.appSigningSecret;
		apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appStrictId] = apiCfg.slack.appStrictSigningSecret;
		apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appSharingId] = apiCfg.slack.appSharingSigningSecret;
	}

	// Github: additional providers
	apiCfg.github.localProviders = {};
	Object.keys(nativeCfg.integrations.github).forEach(provider => {
		if (provider != 'cloud') {
			apiCfg.github.localProviders[provider] = nativeCfg.itegrations.github[provider];
		}
	});

	// Jira: additional providers
	apiCfg.jira.localProviders = {};
	Object.keys(nativeCfg.integrations.jira).forEach(provider => {
		if (provider != 'cloud') {
			apiCfg.jira.localProviders[provider] = nativeCfg.itegrations.jira[provider];
		}
	});

	// Okta: additional providers
	apiCfg.okta.providers = {};
	Object.keys(nativeCfg.integrations.okta).forEach(provider => {
		if (provider != 'localInstallation') {
			apiCfg.okta.providers[provider] = nativeCfg.itegrations.okta[provider];
		}
	});

	// Email: disable all email if there are no settings for it
	if (Object.keys(apiCfg.email).length == 0) {
		apiCfg.email = { inboundEmailDisabled: true };
	}

	// AWS [SQS or Rabbit]:
	if (nativeCfg.queuingEngine.awsSQS) {
		if (nativeCfg.queuingEngine.awsSQS.region) {
			apiCfg.aws.region = nativeCfg.queuingEngine.awsSQS.region;
		}
		apiCfg.aws.sqs.outboundEmailQueueName = nativeCfg.queuingEngine.awsSQS.outboundEmailQueueName;
	}
	else {
		// FIXME api configured to use rabbit but there's no queue name in the rabbit section
		apiCfg.aws.sqs.outboundEmailQueueName = nativeCfg.queuingEngine.rabbitmq.outboundEmailQueueName;
	}

	return apiCfg;
}

// These configurations refer to the customzed configs if a customConfig option
// is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method.
// function customRestartFunc(priorConfig, currentConfig) {
// }

module.exports = StructuredConfigFactory.create({
	configFile: process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'apiServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
