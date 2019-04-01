// pubnub configuration

'use strict';

<<<<<<< Updated upstream
<<<<<<< Updated upstream
let PubnubCfg = {};
=======
let PubnubCfg = {}
>>>>>>> Stashed changes
=======
let PubnubCfg = {}
>>>>>>> Stashed changes
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
