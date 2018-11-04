'use strict';

const NewPostMessageToDirectTest = require('./new_post_message_to_direct_test');
const Assert = require('assert');

class NewPostNoMessageToDirectTest extends NewPostMessageToDirectTest {

	get description () {
		return 'members of the team who are not members of the stream should not receive a message with the post when a post is posted to a direct stream';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.members = [];
			callback();
		});
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// listen on the team channel, but the message should go to the stream channel
		this.useToken = this.users[1].accessToken;
		this.channelName = `team-${this.team._id}`;
		callback();
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

module.exports = NewPostNoMessageToDirectTest;
