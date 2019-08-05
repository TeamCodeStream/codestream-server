// pubnub configuration

'use strict';

/* eslint no-console: 0 */

const StructuredCfgFile = require('../codestream-configs/lib/structured_config');
let ShowCfg = process.env.CS_API_SHOW_CFG || false;

let PubnubCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new StructuredCfgFile({ configFile: CfgFileName });
	ShowCfg = CfgData.getProperty('apiServer.showConfig');
	PubnubCfg = CfgData.getSection('broadcastEngine.pubnub');
}
else {
	PubnubCfg = {
		publishKey: process.env.CS_API_PUBNUB_PUBLISH_KEY,
		subscribeKey: process.env.CS_API_PUBNUB_SUBSCRIBE_KEY,
		secretKey: process.env.CS_API_PUBNUB_SECRET,
		ssl: true,
		keepAlive: true,
		uuid: 'CodeStreamServer'
	};
}

if (ShowCfg) console.log('Config[pubnub]:', JSON.stringify(PubnubCfg, undefined, 10));
module.exports = PubnubCfg;
