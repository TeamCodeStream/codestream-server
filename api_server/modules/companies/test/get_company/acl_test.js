'use strict';

const GetCompanyTest = require('./get_company_test');

class ACLTest extends GetCompanyTest {

	constructor (options) {
		super(options);
		this.teamOptions = {
			creatorIndex: 1,
			members: []
		};
	}

	get description () {
		return 'should return an error when trying to fetch a company that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	// readAuth
		};
	}
}

module.exports = ACLTest;
