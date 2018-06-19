'use strict';

var CreateTeamJoinMethodTest = require('./create_team_join_method_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AlreadyOnTeamNoCreatedTeamJoinMethodTest extends CreateTeamJoinMethodTest {

	get description () {
		return 'when a user creates a team by posting a repo, but they are already on a team, they should not get a message indicating their join method has changed';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		BoundAsync.series(this, [
			this.createOtherUser,		// create a second registered user
			this.createRepo 			// create a repo (and team), and include the current user
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
				this.team = response.team;
				this.repo = response.repo;
				callback();
			},
			{
				withEmails: [this.currentUser.email],	// include current user, this should block any update to joinMethod when they create another team
				withRandomEmails: 1,	// add an unregisterd user for good measure
				token: this.otherUserData.accessToken	// "other" user creates the repo
			}
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
