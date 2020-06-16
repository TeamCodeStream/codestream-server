'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const MessageToStreamTest = require('./message_to_stream_test');
const AddUserTest = require('./add_user_test');

class AddUserMessageToStreamTest extends Aggregation(MessageToStreamTest, AddUserTest) {

	get description () {
		return 'members of the stream should receive a message with the stream when a user is added to a private channel stream';
	}
}

module.exports = AddUserMessageToStreamTest;
