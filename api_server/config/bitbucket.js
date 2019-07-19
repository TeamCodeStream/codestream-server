// bitbucket integration configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;

let BitBucketCfg = {
	appClientId: null,
	appClientSecret: null
};

if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let bitbucketProviders = CfgData.getSection('integrations.bitbucket');
	if (bitbucketProviders['bitbucket.com']) {
		BitBucketCfg = bitbucketProviders['bitbucket.com'];
	}
}
else {
	BitBucketCfg.appClientId = process.env.CS_API_BITBUCKET_CLIENT_ID;
	BitBucketCfg.appClientSecret = process.env.CS_API_BITBUCKET_CLIENT_SECRET;
}

console.log('bitbucket:', BitBucketCfg);
process.exit();
module.exports = BitBucketCfg;
