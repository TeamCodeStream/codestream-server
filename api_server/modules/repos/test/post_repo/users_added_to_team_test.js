'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class UsersAddedToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'users on the the team when new users are added to the team should receive a message with the new users';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createRepo,		// create a repo (and team)
			this.createOtherUser	// create a second registered user
		], callback);
	}

	// create the pre-existing repo to use for the test
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				token: this.token,	// "current" user creates the repo
				withRandomEmails: 1	// include another unregistered user for good measure
			}
		);
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

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		// for knowing which users are added to a team, this is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// "create" the (pre-existing) repo, and add some users while we're add it, this should trigger
		// a message that the users have been added to the team
		this.repoFactory.createRepo(
			{
				url: this.repo.url,
				firstCommitHash: this.repo.firstCommitHash,
				emails: [
					this.userFactory.randomEmail(),
					this.userFactory.randomEmail()
				]
			},
			this.otherUserData.accessToken,	// we'll have the "second" user create the repo
			(error, response) => {
				if (error) { return callback(error); }
				// we expect to get both the users that were added, and a message for the team adding them as members
				let addedMemberIds = response.users.map(user => user._id);	
				this.message = {
					users: response.users,
					team: {
						_id: this.team._id,
						$addToSet: {
							memberIds: addedMemberIds
						}
					}
				};
				callback();
			}
		);
	}
}

module.exports = UsersAddedToTeamTest;
