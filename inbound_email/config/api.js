// configuration for communicating with the API server

'use strict';

/* eslint no-console: 0 */

function parseUrl(url) {
	let parsed = url.match(/^http(s)?:\/\/([\w\d-.]+)(:(\d+))?\/?/);
	let protocolPort = parsed[1] ? '443' : '80';
	let secure = !!parsed[1];
	return {
		host: parsed[2],
		port: parseInt(parsed[4] || protocolPort, 10),
		secure
	};
}

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ApiCfg = {};
let ShowCfg = process.env.CS_MAILIN_SHOW_CFG || false;

let CfgFileName = process.env.CS_MAILIN_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('inboundEmailServer.showConfig');
	// use the publicApiUrl to find the API server, do not use the apiServer.port
	// param in case the listen port is different than the public port
	ApiCfg = parseUrl(CfgData.getProperty('apiServer.publicApiUrl'));
}
else {
	ApiCfg = {
		host: process.env.CS_MAILIN_API_HOST,
		port: process.env.CS_MAILIN_API_PORT
	};
}

if (ShowCfg) console.log('Config[api]:', JSON.stringify(ApiCfg, undefined, 10));
module.exports = ApiCfg;
