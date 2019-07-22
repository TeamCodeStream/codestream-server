// configuration for communicating with the web server

'use strict';

let WebAppCfg = {
	host: null,
	marketingHost: null
};

// FIXME: This file needs to go!
let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (!CfgFileName) {
	WebAppCfg.host = process.env.CS_API_WEB_CLIENT_ORIGIN || 'http://localhost:1380';
	WebAppCfg.marketingHost = process.env.CS_API_MARKETING_SITE_URL || 'https://teamcodestream.webflow.io';
}

if (process.env.CS_API_SHOW_CFG) console.log('Config[webclient]:', WebAppCfg);
module.exports = WebAppCfg;
