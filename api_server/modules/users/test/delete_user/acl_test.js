'use strict';

const DeleteUserTest = require('./delete_user_test');

class ACLTest extends DeleteUserTest {

	get description () {
		return 'should return an error when trying to delete a user on a different team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the user or an admin can delete a user'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTest;
