'use strict';

const PutCompanyTest = require('./put_company_test');

class ACLTest extends PutCompanyTest {

	get description () {
		return 'should return an error when a non-admin tries to update a company';
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
			callback();
		});
	}
}

module.exports = ACLTest;
