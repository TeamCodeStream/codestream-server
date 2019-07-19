// MSTeams integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let MsTeamsCfg = {
	appClientId: null,
	appClientSecret: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile( {configFile: CfgFileName});
	let msteamsProviders = CfgData.getSection('integrations.msteams');
	if (msteamsProviders['microsoft.com']) {
		MsTeamsCfg = msteamsProviders['microsoft.com'];
	}
}
else {
	MsTeamsCfg.appClientId = process.env.CS_API_MSTEAMS_CLIENT_ID;
	MsTeamsCfg.appClientSecret = process.env.CS_API_MSTEAMS_CLIENT_SECRET;
}

module.exports = MsTeamsCfg;
