// configuration for communicating with the web server

'use strict';

let WebAppCfg = {};
if (process.env.CS_API_CFG_FILE) {
	WebAppCfg = require(process.env.CS_API_CFG_FILE).webAppServer;
}
else {
	WebAppCfg.host = process.env.CS_API_WEB_CLIENT_ORIGIN || 'http://localhost:1380';
	WebAppCfg.marketingHost = process.env.CS_API_MARKETING_SITE_URL || 'https://teamcodestream.webflow.io';
}

module.exports = WebAppCfg;
