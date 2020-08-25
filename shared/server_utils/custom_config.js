'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('../codestream_configs/lib/structured_config');
const MongoUrlParser = require('./mongo/mongo_url_parser');

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
			console.error('cannot determine which broadcast engine to use');
			process.exit(1);
		}
	}
	else if (!cfg.broadcastEngine[cfg.broadcastEngine.selected]) {
		console.error(`no config data for broadcast engine ${cfg.broadcastEngine.selected}`);
		process.exit(1);
	}

	// meh - we should eliminate this object
	if (cfg.broadcastEngine.selected === 'codestreamBroadcaster') {
		cfg.socketCluster = {
			host: cfg.broadcastEngine.codestreamBroadcaster.host,
			port: cfg.broadcastEngine.codestreamBroadcaster.port,
			authKey: cfg.broadcastEngine.codestreamBroadcaster.secrets.api,
			ignoreHttps: cfg.broadcastEngine.codestreamBroadcaster.ignoreHttps,
			strictSSL: cfg.ssl.requireStrictSSL,
			apiSecret: cfg.broadcastEngine.codestreamBroadcaster.secrets.api
		};
	}
}

// Read the structured config to determine which queuing engine we'll use and then
// set the data needed for it
function selectQueuingEngine(nativeCfg) {
	if (!cfg.queuingEngine.selected) {	// FIXME - add to config schema
		cfg.queuingEngine.selected = cfg.queuingEngine.rabbitmq ? 'rabbitmq' : 'awsSQS';
	}
	if (!cfg.queueingEngine[cfg.queuingEngine.selected].outboundEmailQueueName) {
		cfg.queueingEngine[cfg.queueingEngine.selected].outboundEmailQueueName = 'outboundEmail';
	}
}

// Read the structured config to determine which email delivery service we'll use (if any)
// and then set the data needed for it
function selectEmailDeliveryService(nativeCfg) {
	if (!cfg.emailDeliveryService.selected) {	// FIXME - add to config schema
		if(cfg.emailDeliveryService.sendgrid) {
			cfg.emailDeliveryService.selected = 'sendgrid';
		}
		else if (cfg.emailDeliveryService.nodeMailer) {
			cfg.emailDeliveryService.selected = 'NodeMailer';
		}
	}
	if (!cfg.emailDeliveryService.selected) {
		console.log("Outbound email is disabled (no service has been configured)");
	}
}

// produce one unified config object for all backend services
function customConfigFunc(nativeCfg) {
	const Cfg = JSON.parse(JSON.stringify(nativeCfg));

	selectBroadcastEngine(Cfg);
	selectQueuingEngine(Cfg);
	selectEmailDeliveryService(Cfg);

	// customizations for the outbound email service
	Cfg.outboundEmailServer.logging.basename = 'outbound-email';  // use this for the basename of the log file
	Cfg.outboundEmailServer.logging.retentionPeriod = 30 * 24 * 60 * 60 * 1000;  // retain log files for this many milliseconds
	Cfg.outboundEmailServer.maxPostsPerEmail = 25;  // maximum number of posts in an email notification
	// the outbound email server can override the mongo url in development so
	// we store the effective url and database in the outbound email section
	// and always use those values for the outbound email service.
	if (!Cfg.outboundEmailServer.storage.mongo.url) {
		Cfg.outboundEmailServer.storage.mongo.url = Cfg.storage.mongo.url;
	}
	Cfg.outboundEmailServer.storage.mongo.database = MongoUrlParser(Cfg.outboundEmailCfg.storage.mongo.url).database;
	// override pubnub settings from config file for outbound email
	if (Cfg.whichBroadcastEngine === 'pubnub') {
		Object.assign(Cfg.outboundEmailServer.pubnub, {...Cfg.pubnub, uuid: 'OutboundEmailServer'});
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

	return Cfg;
}

// The restartRequired() method is meant to compare two configurations (prior &
// current) in order to determine if a 'restart' (defined by the application) is
// required.
//
// These two configuration params refer to the customzed configs if a
// customConfig option is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method (usually it's boolean, but it doesn't have to be).
//
// function customRestartFunc(priorConfig, currentConfig) {
// }

module.exports = StructuredConfigFactory.create({
	configFile: process.env.CS_OUTBOUND_EMAIL_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'outboundEmailServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
