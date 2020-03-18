'use strict';

const DeleteUserTest = require('./delete_user_test');

class DeleteSelfTest extends DeleteUserTest {

	get description () {
		return 'should delete associated review when a post is deleted';
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
