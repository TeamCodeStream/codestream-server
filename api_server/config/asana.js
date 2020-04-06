// asana integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let AsanaCfg = {
	appClientId: null,
	appClientSecret: null
};
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	AsanaCfg = CfgData.getSection('integrations.asana.cloud');
}
else {
	AsanaCfg.appClientId = process.env.CS_API_ASANA_CLIENT_ID;
	AsanaCfg.appClientSecret = process.env.CS_API_ASANA_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[asana]:', JSON.stringify(AsanaCfg, undefined, 10));
module.exports = AsanaCfg;
