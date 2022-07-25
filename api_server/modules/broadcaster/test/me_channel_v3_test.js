'use strict';

const MeChannelTest = require('./me_channel_test');

class MeChannelV3Test extends MeChannelTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
	}

	get description () {
		return 'should be able to subscribe to and receive a message from my me-channel as a confirmed user, using a V3 PubNub Access Manager issued token';
	}
}

module.exports = MeChannelV3Test;
