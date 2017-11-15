'use strict';

var GetCompaniesTest = require('./get_companies_test');

class GetMyCompaniesTest extends GetCompaniesTest {

	get description () {
		return 'should return companies i am a member of when requesting my companies';
	}

	setPath (callback) {
		this.path = '/companies?mine';
		callback();
	}

	validateResponse (data) {
		let myCompanies = [this.myCompany, ...this.otherCompanies];
		this.validateMatchingObjects(myCompanies, data.companies, 'companies');
		super.validateResponse(data);
	}
}

module.exports = GetMyCompaniesTest;
