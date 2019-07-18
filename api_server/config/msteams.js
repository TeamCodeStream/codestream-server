// MSTeams integration configuration

'use strict';

const structuredCfgFile = require('./codestream-configs/lib/structured_config');

let MsTeamsCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({
		schemaFile: './codestream-configs/parameters.json',
		configFile: CfgFileName
	});
	let msteamsProviders = CfgData.getSection('integrations.msteams');
	console.log(msteamsProviders);
	process.exit();

	MsTeamsCfg = require(process.env.CS_API_CFG_FILE).integrations.msteams['microsoft.com'] || {
		appClientId: null,
		appClientSecret: null,
		localProvider: false
	};
}
else {
	MsTeamsCfg.appClientId = process.env.CS_API_MSTEAMS_CLIENT_ID;
	MsTeamsCfg.appClientSecret = process.env.CS_API_MSTEAMS_CLIENT_SECRET;
	MsTeamsCfg.localProvider = false;
}

module.exports = MsTeamsCfg;
