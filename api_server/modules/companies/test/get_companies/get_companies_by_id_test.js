'use strict';

const GetCompaniesTest = require('./get_companies_test');

class GetCompaniesByIdTest extends GetCompaniesTest {

	get description () {
		return 'should return the correct companies when requesting companies by ID';
	}

	setPath (callback) {
		// i'm in both of these companies, so i should be able to fetch them
		if (this.oneUserPerOrg) {
			this.path = `/companies?ids=${this.company.id}`; // only this makes in ONE_USER_PER_ORG
		} else {
			this.path = `/companies?ids=${this.company.id},${this.companyWithMe.id}`;
		}
		callback();
	}
}

module.exports = GetCompaniesByIdTest;
