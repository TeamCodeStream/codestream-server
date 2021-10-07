'use strict';

const PutCompanyTest = require('./put_company_test');

class NoEveryoneTeamTest extends PutCompanyTest {

	get description () {
		return 'should return an error when trying to update a company that has not been migrated to "company-centric"';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010',
			reason: 'cannot update a company that has no "everyone" team'
		};
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			delete this.teamOptions.createCompanyInstead; // removes the flag that uses company-centric company creation
			callback();
		});
	}
}

module.exports = NoEveryoneTeamTest;
