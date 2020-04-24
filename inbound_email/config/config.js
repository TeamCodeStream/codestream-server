'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('../codestream-configs/lib/structured_config');

const CfgOpts = {};
if (process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE) {
	CfgOpts.configFile = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
}
else if (process.env.CSSVC_CFG_URL) {
	CfgOpts.mongoUrl = process.env.CSSVC_CFG_URL;
}
else {
	console.error('no configuration provided. Set CSSVC_CFG_FILE or CSSVC_CFG_URL.');
	process.exit(1);
}

class InboundEmailServerConfig {
	constructor() {
		this.cfgData = StructuredConfigFactory.create(CfgOpts);
		this.config = null;
		this.lastConfig = null;
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

	getConfig() {
		return this.config;
	}

	// compare this.config and this.lastConfig to determine if a restart or re-initialization is needed
	restartRequired() {
		return false;
	}

	async loadConfig() {
		if (!this.config) {
			await this.cfgData.initialize();
		}
		else {
			await this.cfgData.loadConfig({ reload: true });
			// remember the previous config so we can determine if a restart is needed
			this.lastConfig = JSON.parse(JSON.stringify(this.config));  // poor-man's deep copy
		}
		this.config = this.cfgData.getCustomConfig(this._customizeConfig);
		if (this.config.inboundEmail.showConfig) {
			console.log('Config[config]:', JSON.stringify(this.config, undefined, 10));
		}
		return this.config;
	}

	async isDirty() {
		return this.cfgData.isDirty();
	}
}

module.exports = new InboundEmailServerConfig();
