// asana integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let JiraCfg = {
	appClientId: null,
	appClientSecret: null,
	localProviders: {}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let jiraProviders = CfgData.getSection('integrations.jira');
	Object.keys(jiraProviders).forEach(provider => {
		if (provider == 'atlassian.net') {
			JiraCfg.appClientId = jiraProviders['atlassian.net'].appClientId;
			JiraCfg.appClientSecret = jiraProviders['atlassian.net'].appClientSecret;
		}
		else {
			JiraCfg.localProviders[provider] = jiraProviders[provider];
		}
	});
}
else {
	JiraCfg.appClientId = process.env.CS_API_JIRA_CLIENT_ID;
	JiraCfg.appClientSecret = process.env.CS_API_JIRA_SECRET;
}

if (ShowCfg) console.log('Config[jira]:', JSON.stringify(JiraCfg, undefined, 10));
module.exports = JiraCfg;
