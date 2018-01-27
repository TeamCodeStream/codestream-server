'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewRepoMessageToOtherUserTest extends CodeStreamMessageTest {

	get description () {
		return 'users on a team should receive a message with the repo when a repo is added to the team';
	}

	// make data that needs to exist before the triggering request
	makeData (callback) {
		BoundAsync.series(this, [
			this.createTeamCreator,	// create a user who will create a team
			this.createPostingUser,	// create a user who will trigger the test by creating a new repo
			this.createRepo 		// create the original repo that creates the team, then the second repo will be added to the team created
		], callback);
	}

	// create a user who will create a repo and team
	createTeamCreator (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.teamCreatorData = response;
				callback();
			}
		);
	}

	// create a user who will create a second repo on the same team
	createPostingUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.postingUserData = response;
				callback();
			}
		);
	}

	// create the first repo and team
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.currentUser.email, this.postingUserData.user.email],	// include the "current" user and the user who will create the second repo
				withRandomEmails: 1,	// include an unregistered user for good measure
				token: this.teamCreatorData.accessToken	// team creator creates the repo and team
			}
		);
	}

	// set the channel name we expect to get a message on
	setChannelName (callback) {
		// for a new repo, it is the team channel
		this.channelName = 'team-' + this.team._id;
		callback();
	}

	// make the request that should trigger the message that gets sent out
	generateMessage (callback) {
		// create a second repo in the team we already created
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;	// expect the published message to be identical to the response to this request
				callback();
			},
			{
				token: this.postingUserData.accessToken,	
				teamId: this.team._id
			}
		);
	}
}

module.exports = NewRepoMessageToOtherUserTest;
