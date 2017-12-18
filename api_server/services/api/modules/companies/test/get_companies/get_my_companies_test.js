'use strict';

var GetCompaniesTest = require('./get_companies_test');

class GetMyCompaniesTest extends GetCompaniesTest {

	get description () {
		return 'should return companies i am a member of when requesting my companies';
	}

	// set the path for the test
	setPath (callback) {
		this.path = '/companies?mine';
		callback();
	}

	// validate we got only companies i am in, meaning the company from the repo i created,
	// and the other companies that were created with me as part of the team
	validateResponse (data) {
		let myCompanies = [this.myCompany, ...this.otherCompanies];
		this.validateMatchingObjects(myCompanies, data.companies, 'companies');
		super.validateResponse(data);
	}
}

module.exports = GetMyCompaniesTest;
