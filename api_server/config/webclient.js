// configuration for communicating with the web server

// FIXME: This file needs to go!

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let WebAppCfg = {
	host: null,
	marketingHost: null
};

if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');

}
else {
	WebAppCfg.host = process.env.CS_API_WEB_CLIENT_ORIGIN || 'http://localhost:1380';
	WebAppCfg.marketingHost = process.env.CS_API_MARKETING_SITE_URL || 'https://teamcodestream.webflow.io';
}

if (ShowCfg) console.log('Config[webclient]:', JSON.stringify(WebAppCfg, undefined, 10));
module.exports = WebAppCfg;
