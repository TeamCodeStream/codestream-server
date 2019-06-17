// handle unit tests for the "PUT /provider-auth-code" request,
// to handle obtaining a temporary auth code for initiating a third-party
// authorization flow
 
'use strict';

const ProviderAuthCodeTest = require('./provider_authcode_test');
const NoTeamIdTest = require('./no_team_id_test');
const ACLTest = require('./acl_test');
const ExpirationTest = require('./expiration_test');

class ProviderAuthCodeRequestTester {

	test () {
		new ProviderAuthCodeTest().test();
		new NoTeamIdTest().test();
		new ACLTest().test();
		new ExpirationTest().test();
	}
}

module.exports = new ProviderAuthCodeRequestTester();
