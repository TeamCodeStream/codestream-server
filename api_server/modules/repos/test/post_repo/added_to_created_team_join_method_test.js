'use strict';

var CodeStreamMessageTest = require(process.env.CS_API_TOP + '/modules/messager/test/codestream_message_test');

class AddedToCreatedTeamJoinMethodTest extends CodeStreamMessageTest {

	get description () {
		return 'when a user is added to their first team when that team is being created, they should get a message indicating their join method as "Joined Team", and primary referral as "internal"';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		this.createOtherUser(callback);	// create a second registered user to create the repo and team
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
		this.channelName = 'user-' + this.currentUser._id;
		callback();
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// create the repo/team and add the current user a member
		this.repoFactory.createRandomRepo(
			(error, response) => {
				// this is the message we expect to see
				this.message = response;
				let currentUser = this.message.users.find(user => user._id === this.currentUser._id);
				delete currentUser.teamIds;
				delete currentUser.companyIds;
				currentUser.$addToSet = {
					teamIds: response.repo.teamId,
					companyIds: response.repo.companyId
				};
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// add the "current" user in creating the team/repo
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
		);
	}

	// validate the incoming message
	validateMessage (message) {
		let subMessage = message.message;
		// ignore any other message, we're looking for an update to our own user object
		if (!subMessage.users) {
			return false;
		}
		return super.validateMessage(message);
	}
}

module.exports = AddedToCreatedTeamJoinMethodTest;
