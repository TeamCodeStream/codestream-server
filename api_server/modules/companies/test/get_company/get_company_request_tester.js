// handles unit tests for "GET /companies/:id" requests

'use strict';

const GetCompanyTest = require('./get_company_test');
const GetOtherCompanyTest = require('./get_other_company_test');
const NotFoundTest = require('./not_found_test');
const ACLTest = require('./acl_test');

class GetCompanyRequestTester {

	getCompanyTest () {
		new GetCompanyTest().test();
		new GetOtherCompanyTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetCompanyRequestTester;
