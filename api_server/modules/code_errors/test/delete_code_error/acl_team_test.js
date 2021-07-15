'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');

class ACLTeamTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a code error';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the author or a team admin can delete the code error'
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
