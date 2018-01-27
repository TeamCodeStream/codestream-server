'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UsersJoinExistingRepoMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users added to a team when a repo that already exists is introduced should receive a message that they have been added to the team';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo 			// create a repo (and team)
		], callback);
	}

	// create a second registered user
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error); }
				this.otherUserData = response;
				callback();
			}
		);
	}

	// create the pre-existing repo to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.repo = response.repo;
				this.team = response.team;
				callback();
			},
			{
				withRandomEmails: 1,	// include another unregistered user for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		// for users added to a team, they get the message on their own user channel
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// "create" the (pre-existing) repo, and add the "current" user while we're at it,
		// this should trigger a message to the current user that they've been added to a team
		let repoData = {
			teamId: this.team._id,
			url: this.repo.url,
			firstCommitHash: this.repo.firstCommitHash,
			emails: [this.currentUser.email]	// current user added to team while "creating" the (pre-existing) repo
		};
		this.repoFactory.createRepo(
			repoData,
			this.otherUserData.accessToken,
			(error, response) => {
				if (error) { return callback(error); }
				// in the message we expect to receive, we'll see that we've been added to a team
				this.message = response;
				let currentUser = this.message.users.find(user => user._id === this.currentUser._id);
				delete currentUser.teamIds;
				delete currentUser.companyIds;
				currentUser.$addToSet = {
					teamIds: response.repo.teamId,
					companyIds: response.repo.companyId
				};
				callback();
			}
		);
	}
}

module.exports = UsersJoinExistingRepoMessageTest;
