'use strict';

const RemoveUserTest = require('./remove_user_test');

class AdminRemoveUsersTest extends RemoveUserTest {

	constructor (options) {
		super(options);
		this.dontMakeCurrentUserAdmin = true;
	}

	get description () {
		return 'should return an error when a non-admin tries to remove a user from a team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1002'
		};
	}
}

module.exports = AdminRemoveUsersTest;
