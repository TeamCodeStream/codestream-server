'use strict';

const DeleteUserTest = require('./delete_user_test');

class DeleteSelfTest extends DeleteUserTest {

	get description () {
		return 'user should not be able to delete themselves if they are not an admin';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the user or an admin can delete a user'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.testUser = 0; // this makes me try to delete myself
			this.teamOptions.creatorIndex = 1; // this makes me part of the team and not an admin
			callback();
		});
	}
}

module.exports = DeleteSelfTest;
