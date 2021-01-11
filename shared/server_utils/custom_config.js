'use strict';

/* eslint no-console: 0 */

const MongoUrlParser = require('./mongo/mongo_url_parser');

function parseUrl(url) {
	let parsed = url.match(/^http(s)?:\/\/([\w\d-.]+)(:(\d+))?\/?/);
	let protocolPort = parsed[1] ? '443' : '80';
	let secure = !!parsed[1];
	return {
		host: parsed[2],
		port: parseInt(parsed[4] || protocolPort, 10),
		secure
	};
}

// Read the structured config to determine which broadcast engine we'll use, then
// set the data needed for it.
function selectBroadcastEngine(cfg) {
	if (!cfg.broadcastEngine.selected) {	// FIXME - add to config schema
		if (cfg.broadcastEngine.pubnub) {
			cfg.broadcastEngine.selected = 'pubnub';
		} else if (Object.keys(cfg.broadcastEngine.codestreamBroadcaster).length != 0) {
			cfg.broadcastEngine.selected = 'codestreamBroadcaster';
		}
		else {
			console.error('FATAL: cannot determine which broadcast engine to use');
			process.exit(1);
		}
	}
	else if (!cfg.broadcastEngine[cfg.broadcastEngine.selected]) {
		console.error(`FATAL: no config data for broadcast engine ${cfg.broadcastEngine.selected}`);
		process.exit(1);
	}
}

// Read the structured config to determine which queuing engine we'll use and
// then set the data needed for it
function selectQueuingEngine(cfg) {
	if (!cfg.queuingEngine.selected) {	// FIXME - add to config schema
		cfg.queuingEngine.selected = cfg.queuingEngine.rabbitmq ? 'rabbitmq' : 'awsSQS';
	}
	if (!cfg.queuingEngine[cfg.queuingEngine.selected].outboundEmailQueueName) {
		cfg.queuingEngine[cfg.queuingEngine.selected].outboundEmailQueueName = 'outboundEmail';
	}
}

// Read the structured config to determine which email delivery service we'll
// use (if any) and then set the data needed for it
function selectEmailDeliveryService(cfg) {
	if (!cfg.emailDeliveryService.selected) {	// FIXME - add to config schema
		if(cfg.emailDeliveryService.sendgrid) {
			cfg.emailDeliveryService.selected = 'sendgrid';
		}
		else if (cfg.emailDeliveryService.NodeMailer) {
			cfg.emailDeliveryService.selected = 'NodeMailer';
		}
	}
	if (!cfg.emailDeliveryService.selected) {
		console.log("Outbound email is disabled (no service has been configured)");
		cfg.apiServer.confirmationNotRequired = true;	// if we cannot send email, we cannot require confirmation
		cfg.email.suppressEmails = true;
		cfg.emailDeliveryService.selected = null;  // this property should always exist
	}
}

function selectUploadEngine(cfg) {
	if (cfg.uploadEngine && !cfg.uploadEngine.selected) {
		if(cfg.uploadEngine.s3) {
			cfg.uploadEngine.selected = 's3';
		}
	}
	else if (cfg.uploadEngine && !cfg.uploadEngine[cfg.uploadEngine.selected]) {
		console.log(`uploadEngine ${cfg.uploadEngine.selected} parameters are missing. Disabling it.`);
		cfg.uploadEngine.selected = null;
	}
	else {
		cfg.uploadEngine = { selected: null };
	}
}

// produce one unified config object for all backend services
module.exports = function customConfigFunc(nativeCfg) {
	const Cfg = JSON.parse(JSON.stringify(nativeCfg));

	selectBroadcastEngine(Cfg);
	selectQueuingEngine(Cfg);
	selectEmailDeliveryService(Cfg);
	// use Config.uploadEngine.selected to determine if an uploadEngine is available (null || 's3')
	selectUploadEngine(Cfg);

	// telemetry
	if(Cfg.telemetry && Cfg.telemetry.disabled) {
		delete Cfg.telemetry;
	}

	// mongo
	Object.assign(Cfg.storage.mongo, {
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
					fields: [
						'providerInfo.*.*.accessToken',
						'providerInfo.*.*.refreshToken',
						'accessTokens.*.token',
						'pubNubToken',
						'broadcasterToken',
						'modifiedRepos',
						'compactModifiedRepos'
					]
				},
				{
					collection: 'reviews',
					fields: ['reviewChangesets', 'reviewDiffs']
				}
			]
		}
	});

	// integrations
	// Ultimately, we plan to eliminate the repeating blocks so for now, in the custom
	// config, we are modifying the structure as follows by removing the block identifier
	// (cloud or localInstallation for okta)
	const integrations = {
		asana: {},
		bitbucket: {},
		azuredevops: {},
		github: {},
		gitlab: {},
		jira: {},
		linear: {},
		msteams: {},
		okta: {},
		slack: {},
		trello: {},
		linear: {},
		// These providers need appClientId to be defined so the api knows those providers can be configured.
		// Their respective APIs do not require a client ID so they're not actually used.
		youtrack: { appClientId: 'placeholder' },
		bitbucket_server: { appClientId: 'placeholder' },
		github_enterprise: { appClientId: 'placeholder' },
		gitlab_enterprise: { appClientId: 'placeholder' },
		jiraserver: { appClientId: 'placeholder' },
		clubhouse: { appClientId: 'placeholder' },
	};
	// THIS WILL OVERWRITE CONFIG DATA IF >1 REPEATING BLOCK (installation) EXISTS FOR A GIVEN PROVIDER
	// The plan is to remove the repeating blocks from the schema.
	// eg. provider: jira, installation: cloud
	Object.keys(Cfg.integrations || {}).forEach(provider => {
		const configProvider = (provider === 'devops') ? 'azuredevops' : provider;
		Object.keys(Cfg.integrations[provider]).forEach(installation => {
			if (!Cfg.integrations[provider][installation].disabled) {
				Object.assign(integrations[configProvider], Cfg.integrations[provider][installation])
			}
		});
	});

	// create the slack signing secret by app id map
	if (Object.keys(integrations.slack).length) {
		integrations.slack.signingSecretsByAppIds = {};
		integrations.slack.signingSecretsByAppIds[integrations.slack.appId] = integrations.slack.appSigningSecret;
		integrations.slack.signingSecretsByAppIds[integrations.slack.appStrictId] = integrations.slack.appStrictSigningSecret;
		integrations.slack.signingSecretsByAppIds[integrations.slack.appSharingId] = integrations.slack.appSharingSigningSecret;
	}
	Cfg.integrations = integrations;

	// payments
	Cfg.payments = Object.assign({}, {
		discountPeriod: 7 * 24 * 60 * 60 * 1000, // within one week of creating a company, we offer a discount
		minPaidSeats: 1,
		...Cfg.payments || {}
	});

	// admin
	if (Cfg.adminServer) {
		// console.log(Cfg.adminServer);
		Cfg.adminServer.logger.basename = 'opadm'
	}
	else {
		Cfg.adminServer = { adminServerDisabled: true }
	}

	// api
	Cfg.apiServer.publicApiUrlParsed = parseUrl(Cfg.apiServer.publicApiUrl);
	Cfg.apiServer.assetEnvironment = process.env.CS_API_ASSET_ENV;
	if (!Cfg.apiServer.authOrigin) {
		Cfg.apiServer.authOrigin = `${Cfg.apiServer.publicApiUrl}/no-auth`;
	}
	Object.assign(Cfg.apiServer.logger, {
		basename: 'api',	// use this for the basename of the log file
		retentionPeriod: 30 * 24 * 60 * 60 * 1000,	// retain log files for this many milliseconds
		globalProperties: {
			environment: Cfg.sharedGeneral.runTimeEnvironment,
			service: 'api'
		}
	});
	// list of third-party providers available for integrations. Provider
	// availability depends on the running configuration. Per-integration
	// modules loaded as needed.
	Cfg.apiServer.thirdPartyProviders = [
		'asana',
		'azuredevops',
		'bitbucket',
		'bitbucket_server',
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
		'okta',
		'clubhouse',
		'linear'
	];
	// matching these paths means Authorization header is not required
	Cfg.apiServer.unauthenticatedPaths = [
		'^\\/no-auth\\/',
		'^\\/robots\\.txt$'
	];
	// matching these paths means Authorization header is optional, behavior may vary
	Cfg.apiServer.optionalAuthenticatedPaths = [
		'^\\/help(\\/|$)',
		'^\\/c\\/',
		'^\\/p\\/',
		'^\\/r\\/',
		'^\\/web\\/'
	];
	// matching these paths means cookie authentication is required
	Cfg.apiServer.cookieAuthenticatedPaths = [
		'^\\/c\\/',
		'^\\/r\\/',
		'^\\/web\\/'
	];
	// matching these paths means csrf protection is required
	Cfg.apiServer.requiresCsrfProtectionPaths = [
		'^\\/c\\/',
		'^\\/p\\/',
		'^\\/r\\/',
		'^\\/web\\/'
	];
	// server will use this cookie to store identity token
	Cfg.apiServer.identityCookie = 'tcs';
	// for testing in mock mode
	Cfg.apiServer.ipc = {
		serverId: 'codestream_api_ipc_server',
		clientId: 'codestream_ipc_client',
		broadcastServerId: 'codestream_broadcaster_ipc_client'
	};
	// serving limits
	Cfg.apiServer.limits = {
		maxPostsPerRequest: 100,	// never serve more than this many posts in a page
		maxStreamsPerRequest: 100,	// never serve more than this many streams in a page
		maxMarkersPerRequest: 100	// never serve more than this many markers in a page (not currently used)
	};

	// broadcaster
	if (Cfg.broadcastEngine.selected === 'codestreamBroadcaster') {
		Cfg.broadcastEngine.codestreamBroadcaster.logger.basename = 'broadcaster';
		Cfg.broadcastEngine.codestreamBroadcaster.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds
		Cfg.broadcastEngine.codestreamBroadcaster.history = {  // message history
			retentionPeriod: 30 * 24 * 60 * 60 * 1000,
			sweepPeriod: 60 * 60 * 1000
		};
	}

	// outbound email service
	Cfg.outboundEmailServer.logger.basename = 'outbound-email';  // use this for the basename of the log file
	Cfg.outboundEmailServer.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;  // retain log files for this many milliseconds
	Cfg.outboundEmailServer.maxPostsPerEmail = 25;  // maximum number of posts in an email notification
	// the outbound email server can override the mongo url in development so
	// we store the effective url and database in the outbound email section
	// and always use those values for the outbound email service.
	if (!Cfg.outboundEmailServer.storage.mongo.url) {
		Cfg.outboundEmailServer.storage.mongo.url = Cfg.storage.mongo.url;
	}
	Cfg.outboundEmailServer.storage.mongo.database = MongoUrlParser(Cfg.outboundEmailServer.storage.mongo.url).database;
	// TODO: consider creating a pubnubUuid prop associated with each service as opposed to overriding the entire structure.
	// override pubnub settings from config file for outbound email
	if (Cfg.broadcastEngine.selected === 'pubnub') {
		Cfg.broadcastEngine.pubnub.uuid = 'OutboundEmailServer';
	}

	// inbound email service
	Cfg.inboundEmailServer.logger.basename = 'inbound-email';
	Cfg.inboundEmailServer.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds

	// Environment-specific logic
	Cfg.apiServer.autoMigrations = !Cfg.sharedGeneral.runTimeEnvironment.match(/^(prod|qa)$/i);
	Cfg.sharedGeneral.isProductionCloud = Cfg.sharedGeneral.runTimeEnvironment === 'prod';
	// we need a better way to determine if the client is running against an on-prem installation but this will do for now
	Cfg.sharedGeneral.isOnPrem = Cfg.adminServer.adminServerDisabled;

	return Cfg;
}
