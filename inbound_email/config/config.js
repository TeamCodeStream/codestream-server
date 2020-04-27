'use strict';

/* eslint no-console: 0 */

const ServiceConfig = require('../server_utils/service_config');

class InboundEmailServerConfig extends ServiceConfig {
	constructor() {
		super({
			showConfigProperty: 'inboundEmailServer.showConfig',
			// only one of these should be defined
			configFile: process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE,
			mongoUrl: process.env.CSSVC_CFG_URL
		});
	}

	// creates a custom config object derived from the loaded native config
	_customizeConfig(nativeCfg) {
		const inboundEmailCfg = {
			api: nativeCfg.apiServer.publicApiUrl,
			inboundEmail: nativeCfg.inboundEmailServer,
			secrets: {
				mailSecret: nativeCfg.sharedSecrets.mail,
				confirmationCheat: nativeCfg.sharedSecrets.confirmationCheat
			},
			logger: nativeCfg.inboundEmailServer.logger,
			// for testing
			pubnub: nativeCfg.broadcastEngine.pubnub
		};

		inboundEmailCfg.inboundEmail.replyToDomain = nativeCfg.email.senderEmail;
		inboundEmailCfg.inboundEmail.senderEmail = nativeCfg.email.senderEmail;
		inboundEmailCfg.inboundEmail.runTimeEnvironment = nativeCfg.sharedGeneral.runTimeEnvironment;

		inboundEmailCfg.logger.basename = 'inbound-email',
		inboundEmailCfg.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds

		return inboundEmailCfg;
	}
}

module.exports = new InboundEmailServerConfig();
