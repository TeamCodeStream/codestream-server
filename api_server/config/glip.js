// Glip integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let GlipCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let glipProviders = CfgData.getSection('integrations.glip');
	if (glipProviders['glip.com']) {
		GlipCfg = glipProviders['glip.com'];
	}
}
else {
	GlipCfg.appClientId = process.env.CS_API_GLIP_CLIENT_ID;
	GlipCfg.appClientSecret = process.env.CS_API_GLIP_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[glip]:', JSON.stringify(GlipCfg, undefined, 10));
module.exports = GlipCfg;
