'use strict';

var CodeStreamMessage_ACLTest = require('./codestream_message_acl_test');

class TeamChannel_ACLTest extends CodeStreamMessage_ACLTest {

	get description () {
		return 'should get an error when trying to subscribe to a team channel for a team i am not a member of';
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

module.exports = TeamChannel_ACLTest;
