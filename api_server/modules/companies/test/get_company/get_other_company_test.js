'use strict';

const GetCompanyTest = require('./get_company_test');

class GetOtherCompanyTest extends GetCompanyTest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return a valid company when requesting a company created by another user that i am part of';
	}
}

module.exports = GetOtherCompanyTest;
