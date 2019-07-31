// MSTeams integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let MsTeamsCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile( {configFile: CfgFileName});
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let msteamsProviders = CfgData.getSection('integrations.msteams');
	if (msteamsProviders['microsoft.com']) {
		MsTeamsCfg = msteamsProviders['microsoft.com'];
	}
}
else {
	MsTeamsCfg.appClientId = process.env.CS_API_MSTEAMS_CLIENT_ID;
	MsTeamsCfg.appClientSecret = process.env.CS_API_MSTEAMS_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[msteams]:', JSON.stringify(MsTeamsCfg, undefined, 10));
module.exports = MsTeamsCfg;
