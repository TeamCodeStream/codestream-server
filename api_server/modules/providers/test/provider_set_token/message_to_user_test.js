'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamMessageTest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/broadcaster/test/codestream_message_test');
const CommonInit = require('./common_init');

class MessageToUserTest extends Aggregation(CodeStreamMessageTest, CommonInit) {

	get description () {
		return 'user should receive a message to update user\'s provider info when a provider token is added';
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

	// generate the message by issuing a request to update the user
	generateMessage (callback) {
		this.setProviderToken(error => {
			if (error) { return callback(error); }
			this.message = this.setProviderTokenResponse;
			callback();
		});
	}
}

module.exports = MessageToUserTest;
