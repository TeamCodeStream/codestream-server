// YouTrack integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let YouTrackCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let YouTrackProviders = CfgData.getSection('integrations.youtrack');
	if (YouTrackProviders['jetbrains.com']) {
		YouTrackCfg = YouTrackProviders['jetbrains.com'];
	}
}
else {
	// this is needed to be non-null to return provider data to the client, but is not actually used
	YouTrackCfg.appClientId = 'placeholder';
}

if (ShowCfg) console.log('Config[youtrack]:', JSON.stringify(YouTrackCfg, undefined, 10));
module.exports = YouTrackCfg;
