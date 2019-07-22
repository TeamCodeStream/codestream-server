// express js configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let ExpressCfg = {
	port: null,
	https: {
		keyfile: null,
		certfile: null,
		cafile: null
	},
	ignoreHttps: false
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	ExpressCfg = {
		port: CfgData.getProperty('apiServer.port'),
		ignoreHttps: CfgData.getProperty('apiServer.ignoreHttps'),
		https: CfgData.getSection('ssl')
	};
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

if (process.env.CS_API_SHOW_CFG) console.log('Config[express]:', ExpressCfg);
module.exports = ExpressCfg;
