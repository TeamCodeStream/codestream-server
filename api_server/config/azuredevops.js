// Azure DevOps integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let DevOpsCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let devOpsProviders = CfgData.getSection('integrations.devops');
	if (devOpsProviders['microsoft.com']) {
		DevOpsCfg = devOpsProviders['microsoft.com'];
	}
}
else {
	DevOpsCfg = {
		appClientId: process.env.CS_API_AZUREDEVOPS_CLIENT_ID,
		appClientSecret: process.env.CS_API_AZUREDEVOPS_CLIENT_SECRET
	};
}

if (ShowCfg) console.log('Config[azuredevops]:', JSON.stringify(DevOpsCfg, undefined, 10));
module.exports = DevOpsCfg;
