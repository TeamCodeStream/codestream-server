'use strict';

var GetMyCompanyTest = require('./get_my_company_test');
var GetOtherCompanyTest = require('./get_other_company_test');
var NotFoundTest = require('./not_found_test');
var ACLTest = require('./acl_test');

class GetCompanyRequestTester {

	getCompanyTest () {
		new GetMyCompanyTest().test();
		new GetOtherCompanyTest().test();
		new NotFoundTest().test();
		new ACLTest().test();
	}
}

module.exports = GetCompanyRequestTester;
