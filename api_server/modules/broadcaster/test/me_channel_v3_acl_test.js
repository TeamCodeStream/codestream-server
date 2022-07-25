'use strict';

const MeChannelACLTest = require('./me_channel_acl_test');

class MeChannelV3ACLTest extends MeChannelACLTest {

	constructor (options) {
		super(options);
		this.useV3BroadcasterToken = true;
	}

	get description () {
		return 'should get an error when trying to subscribe to a user channel that is not my own, using a V3 PubNub Access Manager issued token';
	}
}

module.exports = MeChannelV3ACLTest;
