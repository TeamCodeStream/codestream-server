// handle unit tests for the "GET /no-auth/fetch-user" request to fetch a user record
// (internal use only)

'use strict';

const FetchUserTest = require('./fetch_user_test');
const NotFoundTest = require('./not_found_test');
const EmailRequiredTest = require('./email_required_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');

class FetchUserRequestTester {

	test () {
		new FetchUserTest().test();
		new NotFoundTest().test();
		new EmailRequiredTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
	}
}

module.exports = new FetchUserRequestTester();
