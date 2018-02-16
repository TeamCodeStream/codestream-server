'use strict';

var JoinTeamJoinMethodTest = require('./join_team_join_method_test');
var Assert = require('assert');

class AlreadyOnTeamNoJoinedTeamJoinMethodTest extends JoinTeamJoinMethodTest {

	get description () {
		return 'when a user joins a team by posting a repo, but they are already on a team, they not should get a method indicating their join method has changed';
	}

	// make the data needed before triggering the actual test
	makeData (callback) {
		// create a first repo and team, this should block any update to joinMethod when
		// the same user joins a team by posting a second repo
		this.repoFactory.createRandomRepo(
			(error) => {
				if (error) { return callback(error); }
				super.makeData(callback);
			},
			{
				token: this.token
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

module.exports = AlreadyOnTeamNoJoinedTeamJoinMethodTest;
