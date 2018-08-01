'use strict';

const AddAdminTest = require('./add_admin_test');

class AdminAddAdminsTest extends AddAdminTest {

	constructor (options) {
		super(options);
		this.dontMakeCurrentUserAdmin = true;
	}

	get description () {
		return 'should return an error when a non-admin tries to add an admin to a team';
	}

	getExpectedError () {
		return {
			code: 'TEAM-1002'
		};
	}
}

module.exports = AdminAddAdminsTest;
