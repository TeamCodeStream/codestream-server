'use strict';

const PutCompanyTest = require('./put_company_test');

class ACLTeamTest extends PutCompanyTest {

	get description () {
		return 'should return an error when someone not in the company tries to update a company';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'only admins can update this company'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 1;
			this.teamOptions.members = [];
			callback();
		});
	}
}

module.exports = ACLTeamTest;
