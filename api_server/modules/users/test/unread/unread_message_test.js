'use strict';

const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');

class UneadMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they mark a post as unread';
	}

	// make the data we need to perform the test...
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// should come back through the user's me-channel
		this.channelName = 'user-' + this.currentUser.user.id;
		callback();
	}

	// issue the api request that triggers the message
	generateMessage (callback) {
		this.updatedAt = Date.now();

		// we expect a message the unset the lastReads value for this stream
		this.message = this.expectedData;

		// indicate marking the stream unread
		this.markUnread(callback);
	}

	validateMessage (message) {
		Assert(message.message.user.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		this.message.user.$set.modifiedAt = message.message.user.$set.modifiedAt;
		return super.validateMessage(message);
	}
}

module.exports = UneadMessageTest;
