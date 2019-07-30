// asana integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let JiraCfg = {
	appClientId: null,
	appClientSecret: null,
	localProviders: {}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
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

if (process.env.CS_API_SHOW_CFG) console.log('Config[jira]:', JiraCfg);
module.exports = JiraCfg;
