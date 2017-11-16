'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');

class TeamChannelTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channels for all my teams as a confirmed user';
	}

	makeData (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 2,
				token: this.token
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelTest;
