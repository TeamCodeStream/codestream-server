// handle unit tests for the "GET /xenv/fetch-user" request to fetch a user record
// across environments (internal use only)

'use strict';

const FetchUserTest = require('./fetch_user_test');
const NotFoundTest = require('./not_found_test');
const EmailRequiredTest = require('./email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const FetchByIdTest = require('./fetch_by_id_test');
const NotFoundByIdTest = require('./not_found_by_id_test');
const IdRequiredUnderOneUserPerOrgTest = require('./id_required_under_one_user_per_org_test');

class FetchUserRequestTester {

	test () {
		new FetchUserTest().test();
		new NotFoundTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new FetchByIdTest().test();
		new FetchByIdTest({ oneUserPerOrg: true }).test();
		new NotFoundByIdTest().test();
		new IdRequiredUnderOneUserPerOrgTest().test();
	}
}

module.exports = new FetchUserRequestTester();
