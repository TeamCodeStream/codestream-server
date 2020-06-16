'use strict';

const RemoveAdminTest = require('./remove_admin_test');

class AdminRemoveAdminsTest extends RemoveAdminTest {

	constructor (options) {
		super(options);
		this.dontMakeCurrentUserAdmin = true;
	}

	get description () {
		return 'should return an error when a non-admin tries to remove a user as admin from a team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1002'
		};
	}
}

module.exports = AdminRemoveAdminsTest;
