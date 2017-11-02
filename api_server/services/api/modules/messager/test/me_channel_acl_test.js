'use strict';

var CodeStream_Message_ACL_Test = require('./codestream_message_acl_test');

class Me_Channel_ACL_Test extends CodeStream_Message_ACL_Test {

	get description () {
		return 'should get an error when trying to subscribe to a user channel that is not my own';
	}

	set_channel_name (callback) {
		this.channel_name = 'user-' + this.current_user._id;
		callback();
	}
}

module.exports = Me_Channel_ACL_Test;
