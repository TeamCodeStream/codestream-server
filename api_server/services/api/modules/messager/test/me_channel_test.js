'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');

class MeChannelTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from my me-channel as a confirmed user';
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}
}

module.exports = MeChannelTest;
