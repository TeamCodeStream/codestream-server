'use strict';

var CreateTeamJoinMethodTest = require('./create_team_join_method_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AlreadyOnTeamNoCreatedTeamJoinMethodTest extends CreateTeamJoinMethodTest {

	get description () {
		return 'when a user creates a team, but they are already on a team, they should not get a message indicating their join method has changed';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createTeam, 			// second user creates a team 
			this.addCurrentUser         // add the current user to the team created
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

	// called if message doesn't arrive after timeout, in this case, this is what we want
	messageTimeout () {
		this.messageCallback();
	}

	// called when a message has been received, in this case this is bad
	messageReceived (error, message) {
		if (error) { return this.messageCallback(error); }
		if (message.message.user) {
			// ignore anything else, but if it has a user object, we'll assume it's
			// the message we *shouldn't* receive
			Assert.fail('message was received');
		}
	}
}

module.exports = AlreadyOnTeamNoCreatedTeamJoinMethodTest;
