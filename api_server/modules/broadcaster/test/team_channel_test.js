'use strict';

const CodeStreamMessageTest = require('./codestream_message_test');

class TeamChannelTest extends CodeStreamMessageTest {

	constructor (options) {
		super(options);
		this.wantServer = true;	// want a simulated server to send a message
	}

	get description () {
		return 'should be able to subscribe to and receive a message from the team channels for all my teams as a confirmed user';
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we'll listen on the team channel for the created team
		this.channelName = 'team-' + this.team.id;
		callback();
	}
}

module.exports = TeamChannelTest;
