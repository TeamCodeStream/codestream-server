// handle unit tests for the "GET /xenv/user-companies" request to fetch cross-environment companies
// a given user (by email) is a member of
'use strict';

const UserCompaniesTest = require('./user_companies_test');
const EmailRequiredTest = require('./email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
//const DeprecatedInOneUserPerOrgTest = require('./deprecated_in_one_user_per_org_test');

class UserCompaniesRequestTester {

	test () {
		new UserCompaniesTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		//new DeprecatedInOneUserPerOrgTest().test();
	}
}

module.exports = new UserCompaniesRequestTester();
