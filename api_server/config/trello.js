// trello integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let TrelloCfg = {
	apiKey: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	TrelloCfg.apiKey = CfgData.getProperty('integrations.trello.cloud.apiKey');
}
else {
	TrelloCfg.apiKey = process.env.CS_API_TRELLO_API_KEY;
}

if (ShowCfg) console.log('Config[trello]:', JSON.stringify(TrelloCfg, undefined, 10));
module.exports = TrelloCfg;
