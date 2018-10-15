'use strict';

const AddUserMessageToStreamTest = require('./add_user_message_to_stream_test');

class AddUserMessageToTeamTest extends AddUserMessageToStreamTest {

	get description () {
		return 'members of the team should receive a message with the stream when a user is added to a public channel stream';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since it is a public stream, the channel will be the team channel
		this.channelName = `team-${this.team._id}`;
		callback();
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.privacy = 'public';
			callback();
		});
	}
}

module.exports = AddUserMessageToTeamTest;
