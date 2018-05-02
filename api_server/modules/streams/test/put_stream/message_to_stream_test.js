'use strict';

const MessageToTeamTest = require('./message_to_team_test');

class MessageToStreamTest extends MessageToTeamTest {

	constructor (options) {
		super(options);
		this.streamPrivacy = 'private'; // create a private channel instead of the default of public
	}

	get description () {
		return 'members of the stream should receive a message with the stream when a private stream is updated';
	}

	// set the name of the channel we expect to receive a message on
	setChannelName (callback) {
		// since it is a private stream, the channel will be the stream channel
		this.channelName = 'stream-' + this.stream._id;
		callback();
	}
}

module.exports = MessageToStreamTest;
