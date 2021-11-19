'use strict';

const ClaimCodeErrorTest = require('./claim_code_error_test');

class ACLTeamTest extends ClaimCodeErrorTest {

	get description () {
		return 'should return an error when trying to claim a code error for a team the user is not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'user is not a member of this team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
