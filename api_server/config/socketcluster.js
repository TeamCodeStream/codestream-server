// socketcluster configuration

'use strict';

/* eslint no-console: 0 */

const CfgData = require('./structuredCfgLoader');
const BroadcastCfg = CfgData.getSection('broadcastEngine.codestreamBroadcaster');
let ClusterCfg;
if (Object.keys(BroadcastCfg).length != 0) {
	ClusterCfg = {
		host: null,
		port: null,
		authKey: null
	};
}
else {
	ClusterCfg = {
		host: BroadcastCfg.host,
		port: BroadcastCfg.port,
		authKey: BroadcastCfg.secrets.api,
		ignoreHttps: BroadcastCfg.ignoreHttps,
		strictSSL: CfgData.getProperty('ssl.requireStrictSSL')
	};
}

if (CfgData.getProperty('apiServer.showConfig'))
	console.log('Config[socketcluster]:', JSON.stringify(ClusterCfg, undefined, 10));
module.exports = ClusterCfg;
