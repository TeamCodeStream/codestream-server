'use strict';

const GetCompaniesTest = require('./get_companies_test');

class GetCompaniesByIdTest extends GetCompaniesTest {

	get description () {
		return 'should return the correct companies when requesting companies by ID';
	}

	setPath (callback) {
		// i'm in both of these companies, so i should be able to fetch them
		this.path = `/companies?ids=${this.company.id}`; // only this makes sense in ONE_USER_PER_ORG
		callback();
	}
}

module.exports = GetCompaniesByIdTest;
