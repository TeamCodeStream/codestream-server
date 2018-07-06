'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
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
			this.pubNubToken = this.addedUserData.pubNubToken;
			this.currentUser = this.addedUserData.user;
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// user receives the message on their own user channel
		this.channelName = 'user-' + this.addedUserData.user._id;
		callback();
	}

	// generate the message by issuing a request
	generateMessage (callback) {
		// do the update, this should trigger a message to the
		// team channel with the updated post
		this.doApiRequest(
			{
				method: this.method,
				path: this.path,
				data: this.data,
				token: this.currentUserToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				const modifiedAt = response.stream.$set.modifiedAt;
				this.message = { stream: Object.assign({}, this.stream, this.expectedStream) }; // we expect to see the whole stream object
				this.message.stream.modifiedAt = modifiedAt;
				callback();
			}
		);
	}
}

module.exports = UserGetsStreamMessageTest;
