'use strict';

const GetCompaniesTest = require('./get_companies_test');

class ACLTest extends GetCompaniesTest {

	get description () {
		return 'should return an error when trying to fetch companies including one that i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'	 // readAuth
		};
	}

	setPath (callback) {
		// include the "foreign" company in the IDs, this should fail
		let ids = [
			this.company._id,
			this.companyWithMe._id,
			this.companyWithoutMe._id
		];
		this.path = '/companies?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACLTest;
