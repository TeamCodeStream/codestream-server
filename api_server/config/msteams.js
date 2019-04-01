// MSTeams integration configuration

'use strict';

let MsTeamsCfg = {};
if (process.env.CS_API_CFG_FILE) {
	MsTeamsCfg = require(process.env.CS_API_CFG_FILE).integrations.msteams['microsoft.com'];
}
else {
	MsTeamsCfg.appClientId = process.env.CS_API_MSTEAMS_CLIENT_ID;
	MsTeamsCfg.appClientSecret = process.env.CS_API_MSTEAMS_CLIENT_SECRET;
}

module.exports = MsTeamsCfg;
