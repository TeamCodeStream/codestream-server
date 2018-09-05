'use strict';

const MessageToStreamTest = require('./message_to_stream_test');

class MessageToTeamTest extends MessageToStreamTest {

	constructor (options) {
		super(options);
		this.useTeamStream = true;
	}

	get description () {
		return 'members of the team should receive a message with the proper directive when a post in a team-stream is reacted to';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// it is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = MessageToTeamTest;
