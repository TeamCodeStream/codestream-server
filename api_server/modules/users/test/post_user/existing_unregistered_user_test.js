'use strict';

const PostUserTest = require('./post_user_test');

class ExistingUnregisteredUserTest extends PostUserTest {

	constructor (options) {
		super(options);
		this.wantExistingUser = true;
	}

	get description () {
		const oneUserPerOrg = this.oneUserPerOrg ? ', under one-user-per-org' : ''; // ONE_USER_PER_ORG
		return `should return the user when inviting a user that already exists but is unregistered${oneUserPerOrg}`;
	}

}

module.exports = ExistingUnregisteredUserTest;
