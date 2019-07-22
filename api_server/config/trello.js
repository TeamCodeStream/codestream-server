// trello integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let TrelloCfg = {
	apiKey: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let trelloProviders = CfgData.getSection('integrations.msteams');
	if (trelloProviders['trello.com']) {
		TrelloCfg.apiKey = trelloProviders['trello.com'].apiKey;
	}
}
else {
	TrelloCfg.apiKey = process.env.CS_API_TRELLO_API_KEY;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[trello]:', TrelloCfg);
module.exports = TrelloCfg;
