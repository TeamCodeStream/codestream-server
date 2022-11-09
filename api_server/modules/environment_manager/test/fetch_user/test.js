// handle unit tests for the "GET /xenv/fetch-user" request to fetch a user record
// across environments (internal use only)

'use strict';

const FetchUserTest = require('./fetch_user_test');
const NotFoundTest = require('./not_found_test');
const NoSecretTest = require('./no_secret_test');
const IncorrectSecretTest = require('./incorrect_secret_test');
const IdRequiredTest = require('./id_required_test');

class FetchUserRequestTester {

	test () {
		new FetchUserTest().test();
		new NotFoundTest().test();
		new NoSecretTest().test();
		new IncorrectSecretTest().test();
		new IdRequiredTest().test();
	}
}

module.exports = new FetchUserRequestTester();
