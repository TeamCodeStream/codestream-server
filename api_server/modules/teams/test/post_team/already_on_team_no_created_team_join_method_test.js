'use strict';

const MessageToUserTest = require('./message_to_user_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AlreadyOnTeamNoCreatedTeamJoinMethodTest extends MessageToUserTest {

	get description () {
		return 'when a user creates a team, but they are already on a team, they should not see join method changes in the message received about having beed added to a team';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createTeam, 			// second user creates a team 
			this.addCurrentUser			// add the current user to the team created
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

	// create the pre-existing team to use for the test
	createTeam (callback) {
		this.teamFactory.createRandomTeam(
			(error, response) => {
				if (error) { return callback(error); }
				this.team = response.team;
				callback();
			},
			{
				token: this.otherUserData.accessToken	// "other" user creates the team
			}
		);
	}

	// add the current user to the first team created
	addCurrentUser (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team._id,
					email: this.currentUser.email
				},
				token: this.otherUserData.accessToken
			},
			callback
		);
	}

	// issue the request that will generate the message we want to listen for
	generateMessage (callback) {
		// issue the usual message, but remove the $set part from the expected message,
		// this is the analytics related stuff that we shouldn't see 
		super.generateMessage(error => {
			if (error) { return callback(error); }
			delete this.message.user.$set;
			callback();
		});
	}
}

module.exports = AlreadyOnTeamNoCreatedTeamJoinMethodTest;
