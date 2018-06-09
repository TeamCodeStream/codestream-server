// configuration for communicating with the web server

'use strict';

module.exports = {
	host: process.env.CS_WEB_CLIENT_HOST || 'localhost',
	port: process.env.CS_WEB_CLIENT_PORT || 12099
};
