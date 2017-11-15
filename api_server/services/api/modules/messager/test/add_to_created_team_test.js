'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class AddToCreatedTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channel when i am added to a created team';
	}

	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,
			this.createRepoWithMe
		], callback);
	}

	// create another user who will create the repo with me added to the team
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create a repo and a team with me as a member
	createRepoWithMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email],
				withRandomEmails: 2,
				token: this.otherUserData.accessToken
			}
		);
	}

	setChannelName (callback) {
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = AddToCreatedTeamTest;
