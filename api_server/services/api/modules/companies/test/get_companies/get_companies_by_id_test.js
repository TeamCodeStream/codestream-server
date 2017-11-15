'use strict';

var GetCompaniesTest = require('./get_companies_test');

class GetCompaniesByIdTest extends GetCompaniesTest {

	get description () {
		return 'should return the correct companies when requesting companies by ID';
	}

	setPath (callback) {
		this.path = `/companies?ids=${this.myCompany._id},${this.otherCompanies[0]._id}`;
		callback();
	}

	validateResponse (data) {
		let myCompanies = [this.myCompany, this.otherCompanies[0]];
		this.validateMatchingObjects(myCompanies, data.companies, 'companies');
		super.validateResponse(data);
	}
}

module.exports = GetCompaniesByIdTest;
