// handle unit tests for the "POST /no-auth/nr-register" request to register a
// user via NR API key
'use strict';

const AlreadyRegisteredEmailTest = require('./already_registered_email_test');
const BadApiKeyTest = require('./bad_api_key_test');
//const EuApiTest = require('./eu_api_test');
const NoApiKeyTest = require('./no_api_key_test');
const NRRegistrationTest = require('./nr_registration_test');
//const StagingApiTest = require('./staging_api_test');
const ExistsButUnregisteredTest = require('./exists_but_unregistered_test');
const ExistsButUnregisteredInvitedTest = require('./exists_but_unregistered_invited_test');

class NRRegistrationRequestTester {

	test () {
		new NRRegistrationTest().test();
		new NoApiKeyTest().test();
		new BadApiKeyTest().test();
		new AlreadyRegisteredEmailTest().test();
		//new EuApiTest().test();
		//new StagingApiTest().test();
		new ExistsButUnregisteredTest().test();
		new ExistsButUnregisteredInvitedTest().test();
	}
}

module.exports = new NRRegistrationRequestTester();
