// slack integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const SlackCfg = CfgData.getSection('integrations.slack.cloud') || {
	appClientId: null,
	appClientSecret: null,
	appStrictClientId: null,
	appStrictClientSecret: null,
	appSharingClientId: null,
	appSharingClientSecret: null
};

SlackCfg.signingSecretsByAppIds = {};
SlackCfg.signingSecretsByAppIds[SlackCfg.appId] = SlackCfg.appSigningSecret;
SlackCfg.signingSecretsByAppIds[SlackCfg.appStrictId] = SlackCfg.appStrictSigningSecret;
SlackCfg.signingSecretsByAppIds[SlackCfg.appSharingId] = SlackCfg.appSharingSigningSecret;

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[slack]:', JSON.stringify(SlackCfg, undefined, 10));
module.exports = SlackCfg;
