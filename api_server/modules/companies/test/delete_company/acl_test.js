'use strict';

const DeleteCompanyTest = require('./delete_company_test');

class ACLTest extends DeleteCompanyTest {

	get description () {
		return 'should return an error when a non-admin tries to delete a company';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1013',
			reason: 'only admins can delete this company'
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
