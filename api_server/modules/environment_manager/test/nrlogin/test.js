// handle unit tests for the "POST /xenv/nrlogin" request to complete an NR auth process
// across environments
'use strict';

const NRLoginTest = require('./nrlogin_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const ParameterRequiredTest = require('./parameter_required_test');
const NewUserInCompanyTest = require('./new_user_in_company_test');
const ExistingUserInCompanyTest = require('./existing_user_in_company_test');
const ExistingUserInCompanyByEmailTest = require('./existing_user_in_company_by_email_test');
const DeleteAPIKeyTest = require('./delete_api_key_test');

class NRLoginTester {

	test () {
		new NRLoginTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new ParameterRequiredTest({ attribute: 'token' }).test();
		new ParameterRequiredTest({ attribute: 'signupToken' }).test();
		new ParameterRequiredTest({ attribute: 'tokenType' }).test();
		new ParameterRequiredTest({ attribute: 'nrOrgId' }).test();
		new ParameterRequiredTest({ attribute: 'email' }).test();
		new ParameterRequiredTest({ attribute: 'refreshToken' }).test();
		new ParameterRequiredTest({ attribute: 'nrUserId' }).test();
		new ParameterRequiredTest({ attribute: 'expiresAt' }).test();
		new NewUserInCompanyTest().test();
		new ExistingUserInCompanyTest().test();
		new ExistingUserInCompanyByEmailTest().test();
		new DeleteAPIKeyTest().test();
	}
}

module.exports = new NRLoginTester();
