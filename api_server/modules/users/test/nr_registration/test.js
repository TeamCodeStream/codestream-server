// handle unit tests for the "POST /no-auth/nr-register" request to register a
// user via NR API key
'use strict';

const AlreadyRegisteredEmailTest = require('./already_registered_email_test');
const BadApiKeyTest = require('./bad_api_key_test');
const NoApiKeyTest = require('./no_api_key_test');
const NRRegistrationTest = require('./nr_registration_test');

class NRRegistrationRequestTester {

	test () {
		new NRRegistrationTest().test();
		new NoApiKeyTest().test();
		new BadApiKeyTest().test();
		new AlreadyRegisteredEmailTest().test();
	}
}

module.exports = new NRRegistrationRequestTester();
