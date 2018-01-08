'use strict';

var GetCompanyTest = require('./get_company_test');

class GetOtherCompanyTest extends GetCompanyTest {

	get description () {
		return 'should return a valid company when requesting a company created by another user that i am part of';
	}

	// set the path for the request to test
	setPath (callback) {
		// requesting the company created by the other user, but i was included in the team
		this.path = '/companies/' + this.otherCompany._id;
		callback();
	}

	// validate that we got the right company
	validateResponse (data) {
		this.validateMatchingObject(this.otherCompany._id, data.company, 'company');
		super.validateResponse(data);
	}
}

module.exports = GetOtherCompanyTest;
