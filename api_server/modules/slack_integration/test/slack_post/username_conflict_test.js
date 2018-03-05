'use strict';

var SlackPostTest = require('./slack_post_test');

class UsernameConflictTest extends SlackPostTest {

	get description () {
		return 'should return an error when trying to send a slack post request from an unknown user whose username conflicts with an existing user on the team that owns the stream';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1000',
		};
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// inject a random email, but with a username that conflicts with an existing user
			this.data.authorEmail = this.userFactory.randomEmail();
			this.data.authorUsername = this.currentUser.username;
			callback();
		});
	}
}

module.exports = UsernameConflictTest;
