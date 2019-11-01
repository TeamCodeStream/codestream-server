// handle unit tests for the "PUT /no-auth/change-email-confirm" request,
// to finalize a user changing their email, after email confirmation is complete
 
'use strict';

/*
const ChangeEmailConfirmTest = require('./change_email_confirm_test');
const ChangeEmailConfirmFetchTest = require('./change_email_confirm_fetch_test');
const TokenRequiredTest = require('./token_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const MissingInPayloadTest = require('./missing_in_payload_test');
const NotEmailTokenTest = require('./not_email_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const MessageToTeamTest = require('./message_to_team_test');
*/

class ChangeEmailConfirmRequestTester {

	test () {
		// DEPRECATED UNTIL CHANGE EMAIL SUPPORTED IN IDE
		/*
		new ChangeEmailConfirmTest().test();
		new ChangeEmailConfirmFetchTest().test();
		new TokenRequiredTest().test();
		new InvalidTokenTest().test();
		new TokenExpiredTest().test();
		new MissingInPayloadTest({ parameter: 'uid' }).test();
		new MissingInPayloadTest({ parameter: 'email' }).test();
		new NotEmailTokenTest().test();
		new UserNotFoundTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
		new MessageToTeamTest().test();
		*/
	}
}

module.exports = new ChangeEmailConfirmRequestTester();
