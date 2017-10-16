'use strict';

module.exports = {
	host: process.env.CS_API_HOST,
	port: process.env.CS_API_PORT,
	https: {
		keyfile: process.env.CS_API_SSL_KEYFILE,
		certfile: process.env.CS_API_SSL_CERTFILE,
		cafile: process.env.CS_API_SSL_CAFILE
	},
	ignore_https: process.env.CS_API_IGNORE_HTTPS
};
