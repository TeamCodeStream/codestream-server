// MSTeams integration configuration

'use strict';

let GlipCfg = {};
if (process.env.CS_API_CFG_FILE) {
	GlipCfg = require(process.env.CS_API_CFG_FILE).integrations.glip['glip.com'];
}
else {
	GlipCfg.appClientId = process.env.CS_API_GLIP_CLIENT_ID;
	GlipCfg.appClientSecret = process.env.CS_API_GLIP_CLIENT_SECRET;
}

module.exports = GlipCfg;
