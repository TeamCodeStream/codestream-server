'use strict';

const RemoveUserMessageToStreamTest = require('./remove_user_message_to_stream_test');

class RemoveUserMessageToTeamTest extends RemoveUserMessageToStreamTest {

	get description () {
		return 'members of the team should receive a message with the stream when a user is removed from a public channel stream';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since it is a public stream, the channel will be the team channel
		this.channelName = `team-${this.team.id}`;
		callback();
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.streamOptions.privacy = 'public';
			callback();
		});
	}
}

module.exports = RemoveUserMessageToTeamTest;
