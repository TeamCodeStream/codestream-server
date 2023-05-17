'use strict';

const PostUserTest = require('./post_user_test');

class ExistingUnregisteredUserTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		return `should return the user when inviting a user that already exists but is unregistered, under one-user-per-org`;
	}

}

module.exports = ExistingUnregisteredUserTest;
