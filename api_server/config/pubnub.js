// pubnub configuration

'use strict';

const structuredCfgFile = require('../codestream-configs/lib/structured_config');

let PubnubCfg = {};

let CfgFileName = process.env.CS_API_CFG_FILE || process.env.CSSVC_CFG_FILE;
if (CfgFileName) {
	const CfgData = new structuredCfgFile({ configFile: CfgFileName });
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

if (process.env.CS_API_SHOW_CFG) console.log('Config[pubnub]:', PubnubCfg);
module.exports = PubnubCfg;
