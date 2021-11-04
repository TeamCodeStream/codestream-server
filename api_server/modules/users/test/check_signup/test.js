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
const NoLoginUnregisteredTest = require('./no_login_unregistered_test');
const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const IsWebmailTest = require('./is_webmail_test');
const AccountIsConnectedTest = require('./account_is_connected_test');
const AccountIsConnectedFalseTest = require('./account_is_connected_false_test');
const AccountIsConnectedByOrgTest = require('./account_is_connected_by_org_test');
const AccountIsConnectedByOrgFalseTest = require('./account_is_connected_by_org_false_test');
const SerializeTests = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/serialize_tests');

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
			NoReuseTokenTest,
			NoLoginUnregisteredTest,
			EligibleJoinCompaniesTest,
			IsWebmailTest,
			AccountIsConnectedTest,
			AccountIsConnectedFalseTest,
			AccountIsConnectedByOrgTest,
			AccountIsConnectedByOrgFalseTest
		]);
	}
}

module.exports = new CheckSignupRequestTester();
