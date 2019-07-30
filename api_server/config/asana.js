// asana integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;

let AsanaCfg = {
	appClientId: null,
	appClientSecret: null
};
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	let asanaProviders = CfgData.getSection('integrations.asana');
	if (asanaProviders['asana.com']) {
		AsanaCfg = asanaProviders['asana.com'];
	}
}
else {
	AsanaCfg.appClientId = process.env.CS_API_ASANA_CLIENT_ID;
	AsanaCfg.appClientSecret = process.env.CS_API_ASANA_CLIENT_SECRET;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[asana]:', AsanaCfg);
module.exports = AsanaCfg;
