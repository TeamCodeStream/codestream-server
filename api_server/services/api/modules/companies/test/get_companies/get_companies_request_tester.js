'use strict';

var GetCompaniesByIdTest = require('./get_companies_by_id_test');
var IDsRequiredTest = require('./ids_required_test');
var GetMyCompaniesTest = require('./get_my_companies_test');
var ACLTest = require('./acl_test');

class GetCompaniesRequestTester {

	getCompaniesTest () {
		new GetMyCompaniesTest().test();
		new GetCompaniesByIdTest().test();
		new IDsRequiredTest().test();
		new ACLTest().test();
	}
}

module.exports = GetCompaniesRequestTester;
