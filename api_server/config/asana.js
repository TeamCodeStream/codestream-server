// asana integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');
let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;

let AsanaCfg = {
	appClientId: null,
	appClientSecret: null
};
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	AsanaCfg = CfgData.getSection('integrations.asana');
}
else {
	AsanaCfg.appClientId = process.env.CS_API_ASANA_CLIENT_ID;
	AsanaCfg.appClientSecret = process.env.CS_API_ASANA_CLIENT_SECRET;
}

module.exports = AsanaCfg;
