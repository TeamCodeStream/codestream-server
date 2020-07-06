// api configuration

'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require(process.env.CSSVC_BACKEND_ROOT + '/shared/codestream_configs/lib/structured_config'); 
const MongoUrlParser = require(process.env.CSSVC_BACKEND_ROOT + '/shared/codestream_configs/lib/mongo_url_parser');

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
	}
	return c;
}

// list of third-party providers available for integrations. Provider availability depends
// on the running configuration. Per-integration modules loaded as needed.
const ThirdPartyProviders = [
	'asana',
	'azuredevops',
	'bitbucket',
	'bitbucket_selfhosted',
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
			installationId: nativeCfg.sharedGeneral.installationId,
			authOrigin: nativeCfg.apiServer.authOrigin || `${nativeCfg.apiServer.publicApiUrl}/no-auth`,
			thirdPartyProviders: ThirdPartyProviders,
			// matching these paths means Authorization header is not required
			unauthenticatedPaths: ['^\\/no-auth\\/', '^\\/robots\\.txt$'],
			// matching these paths means Authorization header is optional, behavior may vary
			optionalAuthenticatedPaths: ['^\\/help(\\/|$)', '^\\/c\\/', '^\\/p\\/', '^\\/r\\/', '^\\/web\\/'],
			// matching these paths means cookie authentication is required
			cookieAuthenticatedPaths: ['^\\/c\\/', '^\\/r\\/', '^\\/web\\/'],
			// matching these paths means csrf protection is required
			requiresCsrfProtectionPaths: ['^\\/c\\/', '^\\/p\\/', '^\\/r\\/', '^\\/web\\/'],
			// server will use this cookie to store identity token
			identityCookie: 'tcs',
			// mock mode skips mongo and pubnub in testing, uses ipc instead of http, makes tests run faster
			mockMode: process.env.CS_API_MOCK_MODE || nativeCfg.apiServer.mockMode
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
		slack: {},
		msteams: {},
		github: {},
		jira: {},
		asana: {},
		trello: {},
		bitbucket: {},
		gitlab: {},
		azuredevops: {},
		okta: {},
		github_enterprise: {
			// this is needed to be non-null to return provider data to the
			// client, but is not actually used
			appClientId: 'placeholder'
		},
		gitlab_enterprise: {
			// this is needed to be non-null to return provider data to the
			// client, but is not actually used
			appClientId: 'placeholder'
		},
		bitbucket_selfhosted: {
			// this is needed to be non-null to return provider data to the
			// client, but is not actually used
			appClientId: 'placeholder'
		},
		jiraserver: {
			// this is needed to be non-null to return provider data to the
			// client, but is not actually used
			appClientId: 'placeholder'
		},
		youtrack: {
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
			maxStreamsPerRequest: 100,  // never serve more than this many streams in a page
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
				disabled: false, // set to true to disable query logging
				/*
				basename: 'mongo-query',
				slowBasename: 'slow-mongo-query',
				reallySlowBasename: 'really-slow-mongo-query',
				slowThreshold: 100,         // queries that take longer than this go to the slow query log
				reallySlowThreshold: 1000,  // queries that take longer than this go to the "really slow" query log
				*/
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
			accessToken: null
		}
	};

	if (nativeCfg.telemetry) {
		if (nativeCfg.telemetry.intercom) {
			apiCfg.intercom.accessToken = nativeCfg.telemetry.intercom.token;
		}
	}

	// broadcast engine config properties
	Object.assign(apiCfg, selectBroadcastEngine(nativeCfg));
	apiCfg.secrets.broadcaster = apiCfg.socketCluster.apiSecret;

	if (nativeCfg.integrations) {
		if (nativeCfg.integrations.slack) {
			apiCfg.slack = nativeCfg.integrations.slack.cloud || {};
			// Slack: for use with signing secrets
			if (nativeCfg.integrations.slack.cloud) {
				apiCfg.slack.signingSecretsByAppIds = {};
				apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appId] = apiCfg.slack.appSigningSecret;
				apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appStrictId] = apiCfg.slack.appStrictSigningSecret;
				apiCfg.slack.signingSecretsByAppIds[apiCfg.slack.appSharingId] = apiCfg.slack.appSharingSigningSecret;
			}
		}
		if (nativeCfg.integrations.msteams) {
			apiCfg.msteams = nativeCfg.integrations.msteams.cloud || {};
		}
		if (nativeCfg.integrations.github) {
			apiCfg.github = nativeCfg.integrations.github.cloud || {};
		}
		if (nativeCfg.integrations.jira) {
			apiCfg.jira = nativeCfg.integrations.jira.cloud || {};
		}
		if (nativeCfg.integrations.asana) {
			apiCfg.asana = nativeCfg.integrations.asana.cloud || {};
		}
		if (nativeCfg.integrations.trello) {
			apiCfg.trello = nativeCfg.integrations.trello.cloud || {};
		}	
		if (nativeCfg.integrations.bitbucket) {
			apiCfg.bitbucket = nativeCfg.integrations.bitbucket.cloud || {};
		}
		if (nativeCfg.integrations.gitlab) {
			apiCfg.gitlab = nativeCfg.integrations.gitlab.cloud || {};
		}
		if (nativeCfg.integrations.devops) {
			apiCfg.azuredevops = nativeCfg.integrations.devops.cloud || {};
		}
		if (nativeCfg.integrations.okta) {
			apiCfg.okta = nativeCfg.integrations.okta.localInstallation || {};
		}
		// FIXME - why are we using gitlab settings for gitlab_enterprise
		if (nativeCfg.integrations.gitlab) {
			apiCfg.gitlab_enterprise = nativeCfg.integrations.gitlab.cloud || {};
		}
		if (nativeCfg.integrations.youtrack) {
			apiCfg.youtrack = nativeCfg.integrations.youtrack.cloud || {appClientId: 'placeholder'};
		}
	}

	if (!apiCfg.youtrack.appClientId) {
		// this is needed to be non-null to return provider data to the
		// client, but is not actually used
		apiCfg.youtrack.appClientId = 'placeholder';
	}

	// Github: additional providers
	apiCfg.github.localProviders = {};
	const nativeIntegrations = nativeCfg || {};
	Object.keys(nativeIntegrations.github || {}).forEach(provider => {
		if (provider != 'cloud') {
			apiCfg.github.localProviders[provider] = nativeCfg.itegrations.github[provider];
		}
	});

	// Jira: additional providers
	apiCfg.jira.localProviders = {};
	Object.keys(nativeIntegrations.jira || {}).forEach(provider => {
		if (provider != 'cloud') {
			apiCfg.jira.localProviders[provider] = nativeCfg.itegrations.jira[provider];
		}
	});

	// Okta: additional providers
	apiCfg.okta.providers = {};
	Object.keys(nativeIntegrations.okta || {}).forEach(provider => {
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
