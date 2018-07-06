'use strict';

const NewUserTest = require('./new_user_test');
const Assert = require('assert');
const EmailUtilities = require(process.env.CS_API_TOP + '/server_utils/email_utilities');

class UsernameConflictTest extends NewUserTest {

	get description () {
		return 'should create and return a post when trying to send a teams post request from an unknown user whose username conflicts with an existing user on the team that owns the stream, but the author\'s username from MS Teams should be ignored';
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
		const firstPartOfEmail = EmailUtilities.parseEmail(data.users[0].email).name;
		Assert.equal(data.users[0].username, firstPartOfEmail, 'user was created with username that is not the first part of their email');
		this.ignoreUsername = true;	// ignore comparing the username
		super.validateResponse(data);
	}
}

module.exports = UsernameConflictTest;
