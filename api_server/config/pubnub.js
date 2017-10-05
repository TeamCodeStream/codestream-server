'use strict';

module.exports = {
	publishKey: process.env.CI_API_PUBNUB_PUBLISH_KEY,
	subscribeKey: process.env.CI_API_PUBNUB_SUBSCRIBE_KEY,
	secretKey: process.env.CI_API_PUBNUB_SECRET,
	ssl: true
};
