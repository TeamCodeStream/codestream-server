// Azure DevOps integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let DevOpsCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
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
};

if (process.env.CS_API_SHOW_CFG) console.log('Config[azuredevops]:', DevOpsCfg);
module.exports = DevOpsCfg;
