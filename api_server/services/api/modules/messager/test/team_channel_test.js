'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');

class TeamChannelTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channels for all my teams as a confirmed user';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		// create a random repo, which creates a team ... i should be able to receive a message on the team channel
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 2,	// add a few random users
				token: this.token		// i am the creator
			}
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we'll listen on the team channel for the created team
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelTest;
