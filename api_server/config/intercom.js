// Glip integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let IntercomCfg = {
	accessToken: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	IntercomCfg.accessToken = CfgData.getProperty('telemetry.intercom.token');
}
else {
	IntercomCfg.accessToken = process.env.CS_API_INTERCOM_ACCESS_TOKEN;
}

if (ShowCfg) console.log('Config[intercom]:', JSON.stringify(IntercomCfg, undefined, 10));
module.exports = IntercomCfg;
