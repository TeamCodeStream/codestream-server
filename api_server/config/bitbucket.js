// bitbucket integration configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const BitBucketCfg = CfgData.getSection('integrations.bitbucket.cloud') || {appClientId: null, appClientSecret: null};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[bitbucket]:', JSON.stringify(BitBucketCfg, undefined, 10));
module.exports = BitBucketCfg;
