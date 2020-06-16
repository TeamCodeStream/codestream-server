'use strict';

const PostUserTest = require('./post_user_test');
const RandomString = require('randomstring');
const Assert = require('assert');

class DuplicateUsernameOkTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
		this.existingUserIsRegistered = true;
	}

	get description () {
		return 'when inviting a registered user to a team, and that user has the same username as a user on the team, we tolerate the duplicate username instead of throwing an error';
	}

	setOptions () {
		super.setOptions();
		const username = RandomString.generate(8);
		this.userOptions.userData[1] = { username };
		this.userOptions.userData[this.existingRegisteredUserIndex] = { username };
	}

	validateResponse (data) {
		Assert(data.user.username === this.users[1].user.username, 'usernames not duplicated');
		super.validateResponse(data);
	}
}

module.exports = DuplicateUsernameOkTest;
