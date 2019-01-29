// configuration for communicating with the web server

'use strict';

module.exports = {
	host: process.env.CS_API_WEB_CLIENT_ORIGIN || 'localhost:1380',
	marketingHost: process.env.CS_API_MARKETING_SITE_URL || 'https://teamcodestream.webflow.io'
};
