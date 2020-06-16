'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const AddUserTest = require('./add_user_test');
const CommonInit = require('./common_init');

class UserGetsStreamMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, AddUserTest) {

	get description () {
		return 'when a user is added to a private channel stream, they should get a message with the stream';
	}

	// make the data that triggers the message to be received
	makeData (callback) {
		this.init(error => {
			if (error) { return callback(error); }
			// we expect the message on the added user's me-channel
			this.currentUserToken = this.token;
			this.broadcasterToken = this.users[2].broadcasterToken;
			this.currentUser = this.users[2];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// user receives the message on their own user channel
		this.channelName = `user-${this.users[2].user.id}`;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		this.updateStream(error => {
			if (error) { return callback(error); }
			const originalMessage = this.message;
			this.message = { stream: this.stream };
			Object.assign(this.message.stream, originalMessage.stream.$set);
			this.message.stream.memberIds.push(this.users[2].user.id);
			callback();
		});
	}
}

module.exports = UserGetsStreamMessageTest;
