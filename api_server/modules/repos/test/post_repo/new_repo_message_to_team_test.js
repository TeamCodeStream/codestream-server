'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class NewRepoMessageToTeamTest extends CodeStreamMessageTest {

	get description () {
		return 'the team creator should receive a message with the repo when a repo is added to the team';
	}

	// make data that needs to exist before the triggering request
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,	// create a second user who will create the repo and team
			this.createRepo 		// have the current user create the repo, which also creates a team with the second user
		], callback);
	}

	// create a second user who will create the repo and team
	createOtherUser (callback) {
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// the current user creates the repo, which also creates a team
	createRepo (callback) {
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				withEmails: [this.otherUserData.user.email],	// include the second user in the team
				withRandomEmails: 1,	// add another user for good measure
				token: this.token 		// the current user is creating this repo
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
		// have the second user create a second repo in the team we already created
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				this.message = response;
				callback();
			},
			{
				token: this.otherUserData.accessToken,	// the second user creates this repo
				teamId: this.team._id
			}
		);
	}
}

module.exports = NewRepoMessageToTeamTest;
