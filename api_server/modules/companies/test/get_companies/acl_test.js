'use strict';

var GetCompaniesTest = require('./get_companies_test');

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
			this.myCompany._id,
			this.otherCompanies[0]._id,
			this.foreignCompany._id
		];
		this.path = '/companies?ids=' + ids.join(',');
		callback();
	}
}

module.exports = ACLTest;
