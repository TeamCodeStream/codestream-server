// handle unit tests for the "PUT /check-signup" request to match a client-issued token
// with a user signup, and if a match is found, sign the user in

'use strict';

const CheckSignupTest = require('./check_signup_test');
const TokenIsValidTest = require('./token_is_valid_test');
const TokenRequiredTest = require('./token_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const BadTokenTest = require('./bad_token_test');
const TokenExpiredTest = require('./token_expired_test');
const NoTeamsTest = require('./no_teams_test');
const NoReuseTokenTest = require('./no_reuse_token_test');
const SerializeTests = require(process.env.CS_API_TOP + '/lib/test_base/serialize_tests');


class CheckSignupRequestTester {

	test () {
		// these tests must be serialized because for technical reasons the tests
		// are actually run in their "before" stage, and they will fail due to timeouts
		// if they are run in parallel
        SerializeTests([
            CheckSignupTest,
            TokenIsValidTest,
            TokenRequiredTest,
            InvalidTokenTest,
            BadTokenTest,
            TokenExpiredTest,
            NoTeamsTest,
            NoReuseTokenTest
        ]);
    }
}

module.exports = new CheckSignupRequestTester();
