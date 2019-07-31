// slack integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let SlackCfg = {
	appClientId: null,
	appClientSecret: null,
	appStrictClientId: null,
	appStrictClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let slackProviders = CfgData.getSection('integrations.slack');
	if (slackProviders['slack.com']) {
		SlackCfg = slackProviders['slack.com'];
	}
}
else {
	SlackCfg.appClientId = process.env.CS_API_SLACK_CLIENT_ID;
	SlackCfg.appClientSecret = process.env.CS_API_SLACK_CLIENT_SECRET;
	SlackCfg.appStrictClientId = process.env.CS_API_SLACK_STRICT_CLIENT_ID;
	SlackCfg.appStrictClientSecret = process.env.CS_API_SLACK_STRICT_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[slack]:', JSON.stringify(SlackCfg, undefined, 10));
module.exports = SlackCfg;
