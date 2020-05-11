// okta integration configuration

'use strict';

/* eslint no-console: 0 */

// TEMPORARY SHAMLESS HARD-CODING
// module.exports = {
// 	appClientId: '0oaaml9cakUVZevmy4x6',
// 	appClientSecret: 'MXFlwnTBDCkNrLPJ-4C4mJUvgS8OkTnciyn-5BNh'
// };

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let OktaCfg = {
	appClientId: null,
	appClientSecret: null,
	localProviders: {}
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let oktaProviders = CfgData.getSection('integrations.okta');
	Object.keys(oktaProviders).forEach(provider => {
		if (provider == 'localInstallation') {
			OktaCfg.appClientId = oktaProviders.localInstallation.appClientId;
			OktaCfg.appClientSecret = oktaProviders.localInstallation.appClientSecret;
		}
		else {
			OktaCfg.localProviders[provider] = oktaProviders[provider];
		}
	});
}
else {
	OktaCfg.appClientId = process.env.CS_API_OKTA_CLIENT_ID;
	OktaCfg.appClientSecret = process.env.CS_API_OKTA_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[okta]:', JSON.stringify(OktaCfg, undefined, 10));
module.exports = OktaCfg;
