'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const CommonInit = require('./common_init');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostStreamTest = require('./post_channel_stream_test');

class NewStreamToMembersTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostStreamTest) {

	get description () {
		return `members of the stream should receive a message with the stream when a ${this.type} stream is added to a team`;
	}

	// make the data to use for the test
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel to listen for the message on
	setChannelName (callback) {
		// listen on the current user's me-channel, they should get a message that they have been
		// added to the team
		this.channelName = `user-${this.currentUser.user._id}`;
		callback();
	}

	// issue the request that will trigger the message to be sent
	generateMessage (callback) {
		// create a channel or direct stream, this should send a message to the users that they've been 
		// added to the stream
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				type: this.type,
				token: this.users[1].accessToken,
				teamId: this.team._id,
				memberIds: [this.currentUser.user._id]
			}
		);
	}
}

module.exports = NewStreamToMembersTest;
