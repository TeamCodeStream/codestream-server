'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToUserTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'the user should receive a message with the stream and preferences update when opening a previously closed stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.message = this.expectedResponse;
		this.doApiRequest(
			{
				method: 'put',
				path: '/open/' + this.stream._id,
				data: {},
				token: this.currentUser.accessToken
			},
			callback
		);
	}

	validateMessage (message) {
		if (message.message.stream.$set) { return false;}
		return super.validateMessage(message);
	}
}

module.exports = MessageToUserTest;
