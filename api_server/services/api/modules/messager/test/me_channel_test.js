'use strict';

var CodeStream_Message_Test = require('./codestream_message_test');

class Me_Channel_Test extends CodeStream_Message_Test {

	get description () {
		return 'should be able to subscribe to and receive a message from my me-channel as a confirmed user';
	}

	set_channel_name (callback) {
		this.channel_name = 'user-' + this.current_user._id;
		callback();
	}
}

module.exports = Me_Channel_Test;
