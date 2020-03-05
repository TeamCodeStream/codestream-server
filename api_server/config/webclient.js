// configuration for communicating with the web server

// FIXME: This file needs to go!

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const WebAppCfg = {
	host: null,
	marketingHost: CfgData.getProperty('apiServer.marketingSiteUrl')
};

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[webclient]:', JSON.stringify(WebAppCfg, undefined, 10));
module.exports = WebAppCfg;
