// handle unit tests for the "GET /web/confirm-email" request,
// to finalize a user changing their email, after email confirmation is complete
 
'use strict';

const ConfirmEmailTest = require('./confirm_email_test');
const ConfirmEmailFetchTest = require('./confirm_email_fetch_test');
const TokenRequiredTest = require('./token_required_test');
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const MissingInPayloadTest = require('./missing_in_payload_test');
const NotEmailTokenTest = require('./not_email_token_test');
const UserNotFoundTest = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const AlreadyTakenTest = require('./already_taken_test'); // deprecate when we move to ONE_USER_PER_ORG
const AlreadyTakenOkTest = require('./already_taken_ok_test');
const AlreadyTakenInOrgTest = require('./already_taken_in_org_test');
const MessageToTeamTest = require('./message_to_team_test');

class ConfirmEmailRequestTester {

	test () {
		new ConfirmEmailTest().test();
		new ConfirmEmailFetchTest().test();
		new TokenRequiredTest().test();
		new InvalidTokenTest().test();
		new TokenExpiredTest().test();
		new MissingInPayloadTest({ parameter: 'uid' }).test();
		new MissingInPayloadTest({ parameter: 'email' }).test();
		new NotEmailTokenTest().test();
		new UserNotFoundTest().test();
		new NoIssuanceTest().test();
		new TokenDeprecatedTest().test();
		new AlreadyTakenTest().test();
		new AlreadyTakenTest({ isRegistered: true }).test();
		new AlreadyTakenOkTest().test();
		new AlreadyTakenOkTest({ isRegistered: true }).test();
		new AlreadyTakenOkTest({ isRegistered: true, inOrg: true }).test();
		new AlreadyTakenInOrgTest().test();
		new AlreadyTakenInOrgTest({ isRegistered: true }).test();
		new MessageToTeamTest().test();
	}
}

module.exports = new ConfirmEmailRequestTester();
