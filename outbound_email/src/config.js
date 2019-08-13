// general api server configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('./codestream-configs/lib/structured_config');

let Cfg = {
	maxPostsPerEmail: 25,	// maximum number of posts in an email notification
	logging: {
		basename: 'outbound-email',					// use this for the basename of the log file
		retentionPeriod: 30 * 24 * 60 * 60 * 1000	// retain log files for this many milliseconds
	}
};

let CfgFileName = process.env.CS_OUTBOUND_EMAIL_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile( {configFile: CfgFileName} );
	Cfg.logging.consoleOk = CfgData.getProperty('outboundEmailServer.logger.consoleOk');
	Cfg.logging.debugOk = CfgData.getProperty('outboundEmailServer.logger.debugOk');
	Cfg.logging.directory = CfgData.getProperty('outboundEmailServer.logger.directory');

	Cfg.mongo = {};
	Cfg.mongo.url = CfgData.getProperty('outboundEmailServer.storage.mongo.url') || CfgData.getProperty('storage.mongo.url');
	Cfg.mongo.database = CfgData._mongoUrlParse(Cfg.mongo.url).database;

	Cfg.pubnub = CfgData.getSection('broadcastEngine.pubnub');
	// FIXME - this overrides the value in the config file
	Cfg.pubnub.uuid = 'OutboundEmailServer';
	Cfg.socketCluster = CfgData.getSection('broadcastEngine.codestreamBroadcaster');
	Cfg.socketCluster.broadcasterSecret = CfgData.getProperty('broadcastEngine.codestreamBroadcaster.secrets.api');

	Cfg.sendgrid = CfgData.getSection('emailDeliveryService.sendgrid');
	Cfg.sendgrid.emailTo = CfgData.getProperty('email.emailTo');

	Cfg.smtp = CfgData.getSection('emailDeliveryService.NodeMailer');
	Cfg.smtp.emailTo = CfgData.getProperty('email.emailTo');

	Cfg.rabbitmq = CfgData.getSection('queuingEngine.rabbitmq');
	Cfg.outboundEmailQueueName = (Object.keys(Cfg.rabbitmq).length > 0) ? Cfg.rabbitmq.outboundEmailQueueName : CfgData.getProperty('queuingEngine.awsSQS.outboundEmailQueueName');

	Cfg.notificationInterval = CfgData.getProperty('email.notificationInterval');
	Cfg.replyToDomain = CfgData.getProperty('email.replyToDomain');
	Cfg.senderEmail = CfgData.getProperty('email.senderEmail');
	Cfg.supportEmail = CfgData.getProperty('email.supportEmail');
	Cfg.sessionAwayTimeout = CfgData.getProperty('apiServer.sessionAwayTimeout');
	Cfg.inboundEmailDisabled = CfgData.getProperty('inboundEmailServer.inboundEmailDisabled');
}
else {
	// mongo url can come from either a raw supplied url or from individual components,
	// where authentication with user and password may or not be relevant
	let MongoUrl = process.env.CS_OUTBOUND_EMAIL_MONGO_URL;
	if (!MongoUrl) {
		if (process.env.CS_OUTBOUND_EMAIL_MONGO_USER) {
			MongoUrl = `mongodb://${process.env.CS_OUTBOUND_EMAIL_MONGO_USER}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PASS}@${process.env.CS_OUTBOUND_EMAIL_MONGO_HOST}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PORT}/${process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE}`;
		}
		else {
			MongoUrl = `mongodb://${process.env.CS_OUTBOUND_EMAIL_MONGO_HOST}:${process.env.CS_OUTBOUND_EMAIL_MONGO_PORT}/${process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE}`;
		}
	}
	Cfg.mongo = {
		host: process.env.CS_OUTBOUND_EMAIL_MONGO_HOST,
		port: process.env.CS_OUTBOUND_EMAIL_MONGO_PORT,
		database: process.env.CS_OUTBOUND_EMAIL_MONGO_DATABASE,
		user: process.env.CS_OUTBOUND_EMAIL_MONGO_USER,
		pass: process.env.CS_OUTBOUND_EMAIL_MONGO_PASS,
		url: MongoUrl,
		hintsRequired: true
	};

	// pubnub connection configuration
	Cfg.pubnub = {
		publishKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_PUBLISH_KEY,
		subscribeKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_SUBSCRIBE_KEY,
		secretKey: process.env.CS_OUTBOUND_EMAIL_PUBNUB_SECRET,
		ssl: true,
		keepAlive: true,
		uuid: 'OutboundEmailServer'
	};

	// socket cluster connection configuration
	Cfg.socketCluster = {
		host: process.env.CS_OUTBOUND_EMAIL_SOCKET_CLUSTER_HOST,
		port: process.env.CS_OUTBOUND_EMAIL_SOCKET_CLUSTER_PORT,
		broadcasterSecret: process.env.CS_OUTBOUND_EMAIL_BROADCASTER_SECRET
	};

	// sendgrid credentials
	Cfg.sendgrid = {
		url: '/v3/mail/send',
		apiKey: process.env.CS_OUTBOUND_EMAIL_SENDGRID_SECRET,
		emailTo: process.env.CS_OUTBOUND_EMAIL_TO // redirect emails to this address, for safe testing
	};

	// logging (for running as a service)
	Cfg.logging.directory = process.env.CS_OUTBOUND_EMAIL_LOGS;	// put log files in this directory
	Cfg.logging.consoleOk = process.env.CS_OUTBOUND_EMAIL_LOG_CONSOLE_OK;	// also output to the console

	// RabbitMQ configuration
	Cfg.rabbitmq = {
		host: process.env.CS_OUTBOUND_EMAIL_RABBITMQ_HOST,
		port: process.env.CS_OUTBOUND_EMAIL_RABBITMQ_PORT,
		user: process.env.CS_OUTBOUND_EMAIL_RABBITMQ_USER,
		password: process.env.CS_OUTBOUND_EMAIL_RABBITMQ_PASSWORD
	};

	// how often email notifications will be sent per stream
	Cfg.notificationInterval = parseInt(process.env.CS_OUTBOUND_EMAIL_NOTIFICATION_INTERVAL || 300000, 10);

	// reply to will be like <streamId>@dev.codestream.com
	Cfg.replyToDomain = process.env.CS_OUTBOUND_EMAIL_REPLY_TO_DOMAIN;

	// indicates inbound emails (and email replies) are completely disabled (for on-prem)
	Cfg.inboundEmailDisabled = process.env.CS_OUTBOUND_EMAIL_INBOUND_EMAIL_DISABLED;
	
	// we'll send emails from this address
	Cfg.senderEmail = process.env.CS_OUTBOUND_EMAIL_SENDER_EMAIL || 'alerts@codestream.com';

	// SQS queue for queueing outbound email messages
	Cfg.outboundEmailQueueName = process.env.CS_OUTBOUND_EMAIL_SQS;

	// email for support
	Cfg.supportEmail = process.env.CS_OUTBOUND_EMAIL_SUPPORT_EMAIL || 'support@codestream.com';

	// how long before we call a user "away" from keyboard
	Cfg.sessionAwayTimeout = parseInt(process.env.CS_OUTBOUND_EMAIL_SESSION_AWAY_TIMEOUT || 10 * 60 * 1000, 10);

	// smtp credentials
	Cfg.smtp = {
		service: process.env.CS_OUTBOUND_EMAIL_SMTP_SERVICE,
		host: process.env.CS_OUTBOUND_EMAIL_SMTP_HOST,
		port: process.env.CS_OUTBOUND_EMAIL_SMTP_PORT,
		username: process.env.CS_OUTBOUND_EMAIL_SMTP_USERNAME,
		password: process.env.CS_OUTBOUND_EMAIL_SMTP_PASSWORD,
		emailTo: process.env.CS_OUTBOUND_EMAIL_TO // redirect emails to this address, for safe testing
	};
}

if (process.env.CS_OUTBOUND_EMAIL_SHOW_CFG) {
	console.log('Config[config]:', JSON.stringify(Cfg, undefined, 10));
}
module.exports = Cfg;
