'use strict';

const NewUserTest = require('./new_user_test');
const Assert = require('assert');

class UsernameConflictTest extends NewUserTest {

	get description () {
		return 'should create and return a post when trying to send a slack post request from an unknown user whose username conflicts with an existing user on the team that owns the stream, but the author\'s username from slack should be ignored';
	}

	// make the data to be used in the request that triggers the message
	makePostData (callback) {
		super.makePostData(() => {
			// substitute a username that conflicts with an existing user
			this.data.authorUsername = this.currentUser.username;
			callback();
		});
	}

	validateResponse (data) {
		Assert(typeof data.users[0].username === 'undefined', 'user was created with username');
		this.ignoreUsername = true;	// ignore comparing the username
		super.validateResponse(data);
	}
}

module.exports = UsernameConflictTest;
