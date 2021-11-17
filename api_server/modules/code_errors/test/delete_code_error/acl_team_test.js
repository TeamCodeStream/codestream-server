'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class ACLTeamTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when trying to delete a code error in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the creator or a team admin can delete a code error'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.postOptions.creatorIndex = 1;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
