// socketcluster configuration

'use strict';

let ClusterCfg = {};
if (process.env.CS_API_CFG_FILE) {
	let Cfg = require(process.env.CS_API_CFG_FILE);
	ClusterCfg = {
		host: Cfg.broadcastEngine.codestreamBroadcaster.host,
		port: Cfg.broadcastEngine.codestreamBroadcaster.port,
		authKey: Cfg.broadcastEngine.codestreamBroadcaster.secrets.api
	};
}
else {
	ClusterCfg = {
		host: process.env.CS_API_SOCKETCLUSTER_HOST,
		port: process.env.CS_API_SOCKETCLUSTER_PORT,
		authKey: process.env.CS_API_SOCKETCLUSTER_AUTH_KEY
	};
}

module.exports = ClusterCfg;
