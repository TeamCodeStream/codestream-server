'use strict';

const PutCodeErrorTest = require('./put_code_error_test');

class ACLTeamTest extends PutCodeErrorTest {

	get description () {
		return 'should return an error when trying to update a code error in a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only the creator of the code error can make this update'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
