'use strict';

const CompanyTestGroupTest = require('./company_test_group_test');

class ACLTest extends CompanyTestGroupTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when attempting to set test groups for a company i am not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1010'
		};
	}
}

module.exports = ACLTest;
