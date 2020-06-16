'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('./codestream-configs/lib/structured_config');
const MongoUrlParser = require('./codestream-configs/lib/mongo_url_parser');

function customConfigFunc(nativeCfg) {
	const outboundEmailCfg = {
		maxPostsPerEmail: 25,	// maximum number of posts in an email notification
		logging: {
			basename: 'outbound-email',					// use this for the basename of the log file
			retentionPeriod: 30 * 24 * 60 * 60 * 1000	// retain log files for this many milliseconds
		},
		notificationInterval: nativeCfg.email.notificationInterval,
		replyToDomain: nativeCfg.email.replyToDomain,
		senderEmail: nativeCfg.email.senderEmail,
		supportEmail: nativeCfg.email.supportEmail,
		sessionAwayTimeout: nativeCfg.apiServer.sessionAwayTimeout,
		inboundEmailDisabled: nativeCfg.inboundEmailServer.inboundEmailDisabled,
		tokenSecret: nativeCfg.sharedSecrets.auth,
		apiUrl: nativeCfg.apiServer.publicApiUrl,
		showConfig: nativeCfg.outboundEmailServer.showConfig
	};

	outboundEmailCfg.logging.consoleOk = nativeCfg.outboundEmailServer.logger.consoleOk;
	outboundEmailCfg.logging.debugOk = nativeCfg.outboundEmailServer.logger.debugOk;
	outboundEmailCfg.logging.directory = nativeCfg.outboundEmailServer.logger.directory;

	outboundEmailCfg.mongo = {};
	outboundEmailCfg.mongo.url = nativeCfg.outboundEmailServer.storage.mongo.url || nativeCfg.storage.mongo.url;
	outboundEmailCfg.mongo.database = MongoUrlParser(outboundEmailCfg.mongo.url).database;

	// Real-Time Messaging Service
	if (nativeCfg.broadcastEngine.pubnub) {
		outboundEmailCfg.pubnub = nativeCfg.broadcastEngine.pubnub;
		// FIXME - this overrides the value in the config file
		outboundEmailCfg.pubnub.uuid = 'OutboundEmailServer';
	}
	else if (nativeCfg.broadcastEngine.codestreamBroadcaster) {
		outboundEmailCfg.socketCluster = nativeCfg.broadcastEngine.codestreamBroadcaster;
		outboundEmailCfg.socketCluster.runTimeEnvironment = nativeCfg.sharedGeneral.runTimeEnvironment;
		outboundEmailCfg.socketCluster.broadcasterSecret = nativeCfg.broadcastEngine.codestreamBroadcaster.secrets.api;
		outboundEmailCfg.socketCluster.strictSSL = nativeCfg.ssl.requireStrictSSL;
	}
	else {
		console.error('no broadcast service has been configured');
	}

	// Email Service
	if (nativeCfg.emailDeliveryService.sendgrid) {
		outboundEmailCfg.sendgrid = nativeCfg.emailDeliveryService.sendgrid;
		outboundEmailCfg.sendgrid.emailTo = nativeCfg.email.emailTo;
	}
	else if (nativeCfg.emailDeliveryService.NodeMailer) {
		outboundEmailCfg.smtp = nativeCfg.emailDeliveryService.NodeMailer;
		outboundEmailCfg.smtp.emailTo = nativeCfg.email.emailTo;
	}
	else {
		console.error('no outbound email service has been configured');
	}

	// Queuing Service
	// FIXME - ambiguous. Are we using rabbit or aws?
	outboundEmailCfg.rabbitmq = nativeCfg.queuingEngine.rabbitmq;
	outboundEmailCfg.outboundEmailQueueName = (Object.keys(outboundEmailCfg.rabbitmq || {}).length > 0) ? outboundEmailCfg.rabbitmq.outboundEmailQueueName : nativeCfg.queuingEngine.awsSQS.outboundEmailQueueName;

	return outboundEmailCfg;
}

// These configurations refer to the customzed configs if a customConfig option
// is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method.
// function customRestartFunc(priorConfig, currentConfig) {
// }

module.exports = StructuredConfigFactory.create({
	configFile: process.env.CS_OUTBOUND_EMAIL_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'outboundEmailServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
