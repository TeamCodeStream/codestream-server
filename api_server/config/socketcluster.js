// socketcluster configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let ClusterCfg = {
	host: null,
	port: null,
	authKey: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	let BroadcastCfg = CfgData.getSection('broadcastEngine.codestreamBroadcaster');
	const strictSSL = CfgData.getProperty('ssl.requireStrictSSL');
	if (Object.keys(BroadcastCfg).length != 0) {
		ClusterCfg = {
			host: BroadcastCfg.host,
			port: BroadcastCfg.port,
			ignoreHttps: BroadcastCfg.ignoreHttps,
			authKey: BroadcastCfg.secrets.api,
			strictSSL 
		};
	}
}
else {
	ClusterCfg = {
		host: process.env.CS_API_SOCKETCLUSTER_HOST,
		port: process.env.CS_API_SOCKETCLUSTER_PORT,
		authKey: process.env.CS_API_SOCKETCLUSTER_AUTH_KEY
	};
}

if (ShowCfg) console.log('Config[socketcluster]:', JSON.stringify(ClusterCfg, undefined, 10));
module.exports = ClusterCfg;
