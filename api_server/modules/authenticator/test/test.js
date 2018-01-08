// unit tests associated with the authenticator module

'use strict';

// make jshint happy
/* globals describe */

var AuthenticationTest = require('./authentication_test');
var AuthenticationMissingAuthorizationTest = require('./authentication_missing_authorization_test');
var AuthenticationInvalidTokenTest = require('./authentication_invalid_token_test');
var AuthenticationNoUserIDTest = require('./authentication_no_user_id_test');
var AuthenticationUserNotFoundTest = require('./authentication_user_not_found_test');

describe('authentication', function() {

	this.timeout(5000);

	new AuthenticationTest().test();
	new AuthenticationMissingAuthorizationTest().test();
	new AuthenticationInvalidTokenTest().test();
	new AuthenticationNoUserIDTest().test();
	new AuthenticationUserNotFoundTest().test();

});
