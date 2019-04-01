// pubnub configuration

'use strict';

let PubnubCfg = {};
if (process.env.CS_API_CFG_FILE) {
	PubnubCfg = require(process.env.CS_API_CFG_FILE).broadcastEngine.pubnub;
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

module.exports = PubnubCfg;
