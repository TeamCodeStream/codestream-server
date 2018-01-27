'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class UsersJoinNewTeamMessageTest extends CodeStreamMessageTest {

	get description () {
		return 'users added to a team when a repo and team are created should receive a message that they have been added to the team';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		// create a second registered user
		this.userFactory.createRandomUser(
			(error, response) => {
				if (error) { return callback(error);}
				this.otherUserData = response;
				callback();
			}
		);
	}

	// set the name of the channel on which to listen for messages
	setChannelName (callback) {
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// create another repo in a different team, and add the "current" user while we're at it,
		// this should trigger a message to the current user that they've been added to a team
		this.repoFactory.createRandomRepo(
			(error, response) => {
				if (error) { return callback(error); }
				// in the message we expect to receive, we'll see that we've been added to a team
				this.message = response;
				let currentUser = this.message.users.find(user => user._id === this.currentUser._id);
				delete currentUser.teamIds;
				delete currentUser.companyIds;
				currentUser.$addToSet = {
					teamIds: response.team._id,
					companyIds: response.company._id
				};
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// add "current" user to team
				withRandomEmails: 1,					// add another unregistered user for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}
}

module.exports = UsersJoinNewTeamMessageTest;
