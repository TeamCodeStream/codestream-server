'use strict';

const DeleteUserTest = require('./delete_user_test');

class NonAdminCantDeleteTest extends DeleteUserTest {

	get description () {
		return 'should return an error when a non-admin tries to delete a user other than themselves';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the user or an admin can delete a user'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = NonAdminCantDeleteTest;
