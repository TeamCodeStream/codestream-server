'use strict';

/* eslint no-console: 0 */

// const StringifySortReplacer = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/stringify_sort_replacer');

// function parseUrl(url) {
// 	let parsed = url.match(/^http(s)?:\/\/([\w\d-.]+)(:(\d+))?\/?/);
// 	let protocolPort = parsed[1] ? '443' : '80';
// 	let secure = !!parsed[1];
// 	return {
// 		host: parsed[2],
// 		port: parseInt(parsed[4] || protocolPort, 10),
// 		secure
// 	};
// }

// function customConfigFunc(nativeCfg) {
// 	console.log('Unified Custom Config:', JSON.stringify(customConfigFunc2(nativeCfg), StringifySortReplacer, 4));

// 	const inboundEmailCfg = {
// 		api: nativeCfg.apiServer.publicApiUrl,
// 		inboundEmail: nativeCfg.inboundEmailServer,
// 		secrets: {
// 			mailSecret: nativeCfg.sharedSecrets.mail,
// 			confirmationCheat: nativeCfg.sharedSecrets.confirmationCheat
// 		},
// 		logger: nativeCfg.inboundEmailServer.logger,
// 		// for testing
// 		pubnub: nativeCfg.broadcastEngine.pubnub
// 	};

// 	inboundEmailCfg.apiServer = parseUrl(inboundEmailCfg.api);

// 	inboundEmailCfg.inboundEmail.replyToDomain = nativeCfg.email.replyToDomain;
// 	inboundEmailCfg.inboundEmail.senderEmail = nativeCfg.email.senderEmail;
// 	inboundEmailCfg.inboundEmail.runTimeEnvironment = nativeCfg.sharedGeneral.runTimeEnvironment;

// 	inboundEmailCfg.logger.basename = 'inbound-email',
// 		inboundEmailCfg.logger.retentionPeriod = 30 * 24 * 60 * 60 * 1000;	// retain log files for this many milliseconds

// 	return inboundEmailCfg;
// }

const StructuredConfigFactory = require(process.env.CSSVC_BACKEND_ROOT + '/shared/codestream_configs/lib/structured_config');
const customConfigFunc = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/custom_config');

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
	configFile: process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE,
	mongoUrl: process.env.CSSVC_CFG_URL,
	showConfigProperty: 'inboundEmailServer.showConfig',
	// customRestartFunc,
	customConfigFunc
});
