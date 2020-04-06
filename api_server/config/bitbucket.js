// bitbucket integration configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let BitBucketCfg = {
	appClientId: null,
	appClientSecret: null
};

if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	BitBucketCfg = CfgData.getSection('integrations.bitbucket.cloud');
}
else {
	BitBucketCfg.appClientId = process.env.CS_API_BITBUCKET_CLIENT_ID;
	BitBucketCfg.appClientSecret = process.env.CS_API_BITBUCKET_CLIENT_SECRET;
}

if (ShowCfg) console.log('Config[bitbucket]:', JSON.stringify(BitBucketCfg, undefined, 10));
module.exports = BitBucketCfg;
