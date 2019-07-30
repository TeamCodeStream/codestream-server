// Glip integration configuration

'use strict';

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let IntercomCfg = {
	accessToken: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	IntercomCfg.accessToken = CfgData.getProperty('telemetry.intercom.token');
}
else {
	IntercomCfg.accessToken = process.env.CS_API_INTERCOM_ACCESS_TOKEN;
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[intercom]:', IntercomCfg);
module.exports = IntercomCfg;
