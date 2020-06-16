// handles unit tests for "GET /companies" requests

'use strict';

const GetCompaniesTest = require('./get_companies_test');
const GetCompaniesByIdTest = require('./get_companies_by_id_test');
const IDsRequiredTest = require('./ids_required_test');
const ACLTest = require('./acl_test');

class GetCompaniesRequestTester {

	getCompaniesTest () {
		new GetCompaniesTest().test();
		new GetCompaniesByIdTest().test();
		new IDsRequiredTest().test();
		new ACLTest().test();
	}
}

module.exports = GetCompaniesRequestTester;
