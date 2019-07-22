// socketcluster configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let ClusterCfg = {
	host: null,
	port: null,
	authKey: null
};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
	let BroadcastCfg = CfgData.getSection('broadcastEngine.codestreamBroadcaster');
	if (Object.keys(BroadcastCfg).length != 0) {
		ClusterCfg = {
			host: BroadcastCfg.host,
			port: BroadcastCfg.port,
			authKey: BroadcastCfg.secrets.api
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

if (process.env.CS_API_SHOW_CFG) console.log('Config[socketcluster]:', ClusterCfg);
module.exports = ClusterCfg;
