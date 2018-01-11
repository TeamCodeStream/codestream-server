'use strict';

var CodeStreamMessageTest = require('./codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AddToExistingTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'should be able to subscribe to and receive a message from the team channel when i am added to an existing team';
	}

	// make the data needed to prepare for the request that triggers the message
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create another user
			this.createRepoWithoutMe,	// create a repo without me as a member of the team
			this.createRepoWithMe	// create a repo with me as a member of the team
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

	// create a repo and a team without me as a member
	createRepoWithoutMe (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 2,	// a few other users
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}
	// create a repo and a team with me as a member, since a team has already been created,
	// this just adds me to the existing team
	createRepoWithMe (callback) {
		this.repoFactory.createRandomRepo(
			callback,
			{
				teamId: this.team._id,
				withEmails: [this.currentUser.email],	// include me
				token: this.otherUserData.accessToken	// the other user is the creator
			}
		);
	}

	// set the channel name to listen on
	setChannelName (callback) {
		// we expect the message on the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}
}

module.exports = AddToExistingTeamTest;
