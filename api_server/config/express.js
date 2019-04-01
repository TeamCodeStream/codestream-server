// express js configuration

'use strict';

let ExpressCfg = {};
if (process.env.CS_API_CFG_FILE) {
	ExpressCfg = require(process.env.CS_API_CFG_FILE).apiProtocol;
}
else {
	ExpressCfg.port = process.env.CS_API_PORT;
	ExpressCfg.https = { // https key/cert
		keyfile: process.env.CS_API_SSL_KEYFILE,
		certfile: process.env.CS_API_SSL_CERTFILE,
		cafile: process.env.CS_API_SSL_CAFILE
	};
	ExpressCfg.ignoreHttps = process.env.CS_API_IGNORE_HTTPS; // run on http instead of https, for testing only
}

module.exports = ExpressCfg;
