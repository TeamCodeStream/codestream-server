// express js configuration

'use strict';

module.exports = {
	port: process.env.CS_API_PORT,
	https: { // https key/cert
		keyfile: process.env.CS_API_SSL_KEYFILE,
		certfile: process.env.CS_API_SSL_CERTFILE,
		cafile: process.env.CS_API_SSL_CAFILE
	},
	ignoreHttps: process.env.CS_API_IGNORE_HTTPS // run on http instead of https, for testing only
};
