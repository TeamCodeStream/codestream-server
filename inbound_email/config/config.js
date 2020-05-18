'use strict';

/* eslint no-console: 0 */

const StructuredConfigFactory = require('../codestream-configs/lib/structured_config');

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

function customConfigFunc(nativeCfg) {
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

	inboundEmailCfg.apiServer = parseUrl(inboundEmailCfg.api);

	inboundEmailCfg.inboundEmail.replyToDomain = nativeCfg.email.replyToDomain;
	inboundEmailCfg.inboundEmail.senderEmail = nativeCfg.email.senderEmail;
	inboundEmailCfg.inboundEmail.runTimeEnvironment = nativeCfg.sharedGeneral.runTimeEnvironment;

	inboundEmailCfg.logger.basename = 'inbound-email',
	inboundEmailCfg.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds

	return inboundEmailCfg;
}

// These configurations refer to the customzed configs if a customConfig option
// is used, otherwise they refer to the native configs.
//
// The return value can be any type and will be passed back to the caller of the
// restartRequired() method.
// function customRestartFunc(priorConfig, currentConfig) {
// }

module.exports = StructuredConfigFactory.create({
	configFile: process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'inboundEmailServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
