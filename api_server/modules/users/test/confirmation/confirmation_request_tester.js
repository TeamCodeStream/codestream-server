// handle unit tests for the "POST /confirm" request

'use strict';

const ConfirmationTest = require('./confirmation_test');
//const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const ConfirmationTokenDeprecatedTest = require('./confirmation_token_deprecated_test');
const NoAttributeTest = require('./no_attribute_test');
const AlreadyRegisteredTest = require('./already_registered_test');
const AlreadyRegisteredCompanyNameTest = require('./already_registered_company_name_test');
const ConfirmInvitedUserTest = require('./confirm_invited_user_test');
const UnknownUserTest = require('./unknown_user_test');
const IncorrectCodeTest = require('./incorrect_code_test');
const MaxAttemptsTest = require('./max_attempts_test');
const ExpirationTest = require('./expiration_test');
//const ConflictingUsernameTest = require('./conflicting_username_test');
//const NoCodestreamUsernameTest = require('./no_codestream_username_test');
const InitialDataTest = require('./initial_data_test');
const MeAttributesTest = require('./me_attributes_test');
const SubscriptionTest = require('./subscription_test');
const NoSubscribeToTeamChannelTest = require('./no_subscribe_to_team_channel_test');
/*
const InvalidTokenTest = require('./invalid_token_test');
const TokenExpiredTest = require('./token_expired_test');
const NotConfTokenTest = require('./not_conf_token_test');
const NoUidTest = require('./no_uid_test');
const UserNotFound = require('./user_not_found_test');
const NoIssuanceTest = require('./no_issuance_test');
const TokenDeprecatedTest = require('./token_deprecated_test');
const TrackTokenExpiredTest = require('./track_token_expired_test');
const TrackTokenDeprecatedTest = require('./track_token_deprecated_test');
*/
const TrackCodeExpiredTest = require('./track_code_expired_test');
const TrackIncorrectCodeTest = require('./track_incorrect_code_test');
const ReuseCodeTest = require('./reuse_code_test');
const EligibleJoinCompaniesTest = require('./eligible_join_companies_test');
const IsWebmailTest = require('./is_webmail_test');
const ForceCreateCompanyTest = require('./force_create_company_test');
const JoinOnConfirmTest = require('./join_on_confirm_test');
const JoinOnConfirmDifferentEmailTest = require('./join_on_confirm_different_email_test');
const JoinOnConfirmEmailTakenTest = require('./join_on_confirm_email_taken_test');

class ConfirmationRequestTester {

	confirmationTest () {
		new ConfirmationTest().test();
		//new ConfirmationWithLinkTest().test();
		new ConfirmationTokenDeprecatedTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'confirmationCode' }).test();
		new AlreadyRegisteredTest().test();
		new AlreadyRegisteredCompanyNameTest().test();
		new ConfirmInvitedUserTest().test();
		new UnknownUserTest().test();
		new IncorrectCodeTest().test();
		new MaxAttemptsTest().test();
		new ExpirationTest().test();
		//new ConflictingUsernameTest().test();
		//new NoCodestreamUsernameTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new SubscriptionTest({ which: 'user' }).test();
		new SubscriptionTest({ which: 'team' }).test();
		new NoSubscribeToTeamChannelTest().test();
		// new SubscriptionTest({ which: 'stream' }).test(); // subscription to stream channels is deprecated
		// These tests are disabled because confirmation links are deprecated
		//new InvalidTokenTest().test();
		//new TokenExpiredTest().test();
		//new NotConfTokenTest().test();
		//new NoUidTest().test();
		//new UserNotFound().test();
		//new NoIssuanceTest().test();
		//new TokenDeprecatedTest().test();
		//new TrackTokenExpiredTest().test();
		//new TrackTokenDeprecatedTest().test();
		new TrackCodeExpiredTest().test();
		new TrackIncorrectCodeTest().test();
		new ReuseCodeTest().test();
		new EligibleJoinCompaniesTest().test();
		new IsWebmailTest().test();
		new ForceCreateCompanyTest().test();
		new JoinOnConfirmTest().test();
		new JoinOnConfirmDifferentEmailTest().test();
		new JoinOnConfirmEmailTakenTest().test();
	}
}

module.exports = ConfirmationRequestTester;
