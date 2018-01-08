'use strict';

var CodeStreamMessageACLTest = require('./codestream_message_acl_test');

class TeamChannelACLTest extends CodeStreamMessageACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a team channel for a team i am not a member of';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		// create a random repo, without the "other" user
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
		// we'll subscribe to the channel for the created team, but since the pubnub channel
		// is for the "other" user, they won't be able to subscribe
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = TeamChannelACLTest;
