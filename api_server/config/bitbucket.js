// bitbucket integration configuration

'use strict';

let BitBucketCfg = {};
if (process.env.CS_API_CFG_FILE) {
	BitBucketCfg = require(process.env.CS_API_CFG_FILE).integrations.bitbucket['bitbucket.com'];
}
else {
	BitBucketCfg.appClientId = process.env.CS_API_BITBUCKET_CLIENT_ID;
	BitBucketCfg.appClientSecret = process.env.CS_API_BITBUCKET_CLIENT_SECRET;
}

module.exports = BitBucketCfg;
