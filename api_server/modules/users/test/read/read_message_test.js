'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class ReadMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'the user should receive a message on their me-channel when they indicate they have read all messages in a stream';
	}

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
		// we expect a message the unset the lastReads value for this stream
		this.message = this.expectedData;

		// indicate we have "read" the first stream
		this.markRead(callback);
	}
}

module.exports = ReadMessageTest;
