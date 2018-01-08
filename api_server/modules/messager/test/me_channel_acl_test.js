'use strict';

var CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class MeChannelACLTest extends CodeStreamMessageACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a user channel that is not my own';
	}

	// set the channel to try to subscribe to
	setChannelName (callback) {
		// since we've set up the pubnub client for the other user, subscribing to the
		// me-channel for the current user should fail
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}
}

module.exports = MeChannelACLTest;
