// pubnub configuration

'use strict';

module.exports = {
	publishKey: process.env.CS_API_PUBNUB_PUBLISH_KEY,
	subscribeKey: process.env.CS_API_PUBNUB_SUBSCRIBE_KEY,
	secretKey: process.env.CS_API_PUBNUB_SECRET,
	ssl: true
};
