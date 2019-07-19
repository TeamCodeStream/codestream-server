// Glip integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let GlipCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let glipProviders = CfgData.getSection('integrations.glip');
	if (glipProviders['glip.com']) {
		GlipCfg = glipProviders['glip.com'];
	}
}
else {
	GlipCfg.appClientId = process.env.CS_API_GLIP_CLIENT_ID;
	GlipCfg.appClientSecret = process.env.CS_API_GLIP_CLIENT_SECRET;
}

module.exports = GlipCfg;
