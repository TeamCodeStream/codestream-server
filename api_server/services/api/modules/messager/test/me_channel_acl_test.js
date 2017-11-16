'use strict';

var CodeStreamMessage_ACLTest = require('./codestream_message_acl_test');

class MeChannel_ACLTest extends CodeStreamMessage_ACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a user channel that is not my own';
	}

	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}
}

module.exports = MeChannel_ACLTest;
