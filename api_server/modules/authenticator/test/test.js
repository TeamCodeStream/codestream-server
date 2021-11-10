// unit tests associated with the authenticator module

'use strict';

// make eslint happy
/* globals describe */

const AuthenticationTest = require('./authentication_test');
const AuthenticationMissingAuthorizationTest = require('./authentication_missing_authorization_test');
const AuthenticationInvalidTokenTest = require('./authentication_invalid_token_test');
const AuthenticationNoUserIDTest = require('./authentication_no_user_id_test');
const AuthenticationUserNotFoundTest = require('./authentication_user_not_found_test');
const MinIssuanceTest = require('./min_issuance_test');

describe('authentication', function() {

	this.timeout(5000);

	new AuthenticationTest().test();
	/*
	new AuthenticationMissingAuthorizationTest().test();
	new AuthenticationInvalidTokenTest().test();
	new AuthenticationNoUserIDTest().test();
	new AuthenticationUserNotFoundTest().test();
	new MinIssuanceTest().test();
	*/
});
