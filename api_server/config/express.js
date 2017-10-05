'use strict';

module.exports = {
	host: process.env.CI_API_HOST,
	port: process.env.CI_API_PORT,
	https: {
		keyfile: process.env.CI_API_SSL_KEYFILE,
		certfile: process.env.CI_API_SSL_CERTFILE,
		cafile: process.env.CI_API_SSL_CAFILE	
	},
	ignore_https: process.env.CI_API_IGNORE_HTTPS
};
