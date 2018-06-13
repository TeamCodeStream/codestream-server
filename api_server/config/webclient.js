// configuration for communicating with the web server

'use strict';

module.exports = {
	host: process.env.CS_WEB_CLIENT_ORIGIN || 'localhost:12099'
};
