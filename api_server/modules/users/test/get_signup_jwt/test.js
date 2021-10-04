// handle unit tests for the "GET /signup-jwt" request to fetch a signup JWT token
// for the New Relic signup flow

'use strict';

const GetSignupJWTTest = require('./get_signup_jwt_test');
const NoIdeTest = require('./no_ide_test');
const JetBrainsTest = require('./jetbrains_test');

class GetSignupJWTRequestTester {

	test () {
		new GetSignupJWTTest().test();
		new NoIdeTest().test();
		new JetBrainsTest().test();
	}
}

module.exports = new GetSignupJWTRequestTester();
