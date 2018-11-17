'use strict';

const CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
const Assert = require('assert');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const PostStreamTest = require('./post_channel_stream_test');
const CommonInit = require('./common_init');

class NewStreamNoMessageTest extends Aggregation(CodeStreamMessageTest, CommonInit, PostStreamTest) {

	get description () {
		return `members of the team who are not members of the stream should not receive a message with the stream when a ${this.type} stream is added to a team`;
	}

	// make the data to use for the test
	makeData (callback) {
		this.init(callback);
	}

	// set the name of the channel to listen for the message on
	setChannelName (callback) {
		// we'll listen on our me-channel, but no message should be received since we're not a member of the stream
		this.channelName = `user-${this.currentUser.user.id}`;
		callback();
	}

	// issue the request that will trigger the message to be sent
	generateMessage (callback) {
		// create a channel or direct stream, this should send a message to the users that they've been
		// added to the stream, but not to the current user, who is not being added to the stream
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = { stream: response.stream };
				callback();
			},
			{
				type: this.type,
				token: this.users[1].accessToken,	
				teamId: this.team.id,
				memberIds: [this.users[2].user.id]	
			}
		);
	}

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error) {
		if (error) { return this.messageCallback(error); }
		Assert.fail('message was received');
	}
}

module.exports = NewStreamNoMessageTest;
