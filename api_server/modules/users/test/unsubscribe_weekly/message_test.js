'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class MessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'user should receive a message on their me-channel updating preferences when weekly email delivery is turned off by clicking an email link';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// generate the message by issuing a request to unsubscribe from weekly emails
	generateMessage (callback) {
		this.unsubscribeWeekly(callback);
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt set in user message not properly set');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		super.validateMessage(message);
		return true;
	}
}

module.exports = MessageTest;
