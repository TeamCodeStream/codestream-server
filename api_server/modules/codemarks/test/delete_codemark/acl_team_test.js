'use strict';

const DeleteCodemarkTest = require('./delete_codemark_test');

class ACLTeamTest extends DeleteCodemarkTest {

	get description () {
		return 'should return an error when someone who is not on the team tries to delete a codemark';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only the author or a team admin can delete the codemark'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			this.codemarkCreator = 1;
			callback();
		});
	}
}

module.exports = ACLTeamTest;
