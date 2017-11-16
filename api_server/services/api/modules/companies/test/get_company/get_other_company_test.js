'use strict';

var GetCompanyTest = require('./get_company_test');

class GetOtherCompanyTest extends GetCompanyTest {

	get description () {
		return 'should return a valid company when requesting a company created by another user that i am part of';
	}

	setPath (callback) {
		this.path = '/companies/' + this.otherCompany._id;
		callback();
	}

	validateResponse (data) {
		this.validateMatchingObject(this.otherCompany._id, data.company, 'company');
		super.validateResponse(data);
	}
}

module.exports = GetOtherCompanyTest;
