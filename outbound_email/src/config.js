// general api server configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('./codestream-configs/lib/structured_config');

// only one of these are expected to be non-null
const CfgOpts = {};
if (process.env.CS_OUTBOUND_EMAIL_CFG_FILE || process.env.CSSVC_CFG_FILE) {
	CfgOpts.configFile = process.env.CS_OUTBOUND_EMAIL_CFG_FILE || process.env.CSSVC_CFG_FILE;
}
else if (process.env.CSSVC_CFG_URL) {
	CfgOpts.mongoUrl = process.env.CSSVC_CFG_URL;
}
else {
	console.error('no configuration provided. Set CSSVC_CFG_FILE or CSSVC_CFG_URL.');
	process.exit(1);
}

class structuredCfgLoader {
	constructor() {
		this.cfgData = new StructuredCfgFile(CfgOpts);
		this.config = null;
	}

	async loadConfig () {
		if (this.config) {
			return this.config;
		}

		await this.cfgData.initialize();
		const Cfg = {
			maxPostsPerEmail: 25,	// maximum number of posts in an email notification
			logging: {
				basename: 'outbound-email',					// use this for the basename of the log file
				retentionPeriod: 30 * 24 * 60 * 60 * 1000	// retain log files for this many milliseconds
			}
		};
		Cfg.logging.consoleOk = this.cfgData.getProperty('outboundEmailServer.logger.consoleOk');
		Cfg.logging.debugOk = this.cfgData.getProperty('outboundEmailServer.logger.debugOk');
		Cfg.logging.directory = this.cfgData.getProperty('outboundEmailServer.logger.directory');

		Cfg.mongo = {};
		Cfg.mongo.url = this.cfgData.getProperty('outboundEmailServer.storage.mongo.url') || this.cfgData.getProperty('storage.mongo.url');
		Cfg.mongo.database = this.cfgData._mongoUrlParse(Cfg.mongo.url).database;

		Cfg.pubnub = this.cfgData.getSection('broadcastEngine.pubnub');
		// FIXME - this overrides the value in the config file
		Cfg.pubnub.uuid = 'OutboundEmailServer';
		Cfg.socketCluster = this.cfgData.getSection('broadcastEngine.codestreamBroadcaster');
		Cfg.socketCluster.broadcasterSecret = this.cfgData.getProperty('broadcastEngine.codestreamBroadcaster.secrets.api');
		Cfg.socketCluster.strictSSL = this.cfgData.getProperty('ssl.requireStrictSSL');
		
		Cfg.sendgrid = this.cfgData.getSection('emailDeliveryService.sendgrid');
		Cfg.sendgrid.emailTo = this.cfgData.getProperty('email.emailTo');

		Cfg.smtp = this.cfgData.getSection('emailDeliveryService.NodeMailer');
		Cfg.smtp.emailTo = this.cfgData.getProperty('email.emailTo');

		Cfg.rabbitmq = this.cfgData.getSection('queuingEngine.rabbitmq');
		Cfg.outboundEmailQueueName = (Object.keys(Cfg.rabbitmq).length > 0) ? Cfg.rabbitmq.outboundEmailQueueName : this.cfgData.getProperty('queuingEngine.awsSQS.outboundEmailQueueName');

		Cfg.notificationInterval = this.cfgData.getProperty('email.notificationInterval');
		Cfg.replyToDomain = this.cfgData.getProperty('email.replyToDomain');
		Cfg.senderEmail = this.cfgData.getProperty('email.senderEmail');
		Cfg.supportEmail = this.cfgData.getProperty('email.supportEmail');
		Cfg.sessionAwayTimeout = this.cfgData.getProperty('apiServer.sessionAwayTimeout');
		Cfg.inboundEmailDisabled = this.cfgData.getProperty('inboundEmailServer.inboundEmailDisabled');
		Cfg.tokenSecret = this.cfgData.getProperty('sharedSecrets.auth');
		Cfg.apiUrl = this.cfgData.getProperty('apiServer.publicApiUrl');

		if (this.cfgData.getProperty('outboundEmailServer.showConfig')) {
			console.log('Config[config]:', JSON.stringify(Cfg, undefined, 10));
		}
		this.config = Cfg;
		return this.config;
	}
}
 
// `new` will treat this as a singleton class (only 1 instance of it wil exist)
module.exports = new structuredCfgLoader();
