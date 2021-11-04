// handle unit tests for the "POST /confirm" request

'use strict';

const ConfirmationTest = require('./confirmation_test');
//const ConfirmationWithLinkTest = require('./confirmation_with_link_test');
const NoAttributeTest = require('./no_attribute_test');
const AlreadyRegisteredTest = require('./already_registered_test');
const IncorrectCodeTest = require('./incorrect_code_test');
const MaxAttemptsTest = require('./max_attempts_test');
const ExpirationTest = require('./expiration_test');
const ConfirmationMessageToTeamTest = require('./confirmation_message_to_team_test');
//const ConflictingUsernameTest = require('./conflicting_username_test');
//const NoCodestreamUsernameTest = require('./no_codestream_username_test');
const InitialDataTest = require('./initial_data_test');
const MeAttributesTest = require('./me_attributes_test');
const SubscriptionTest = require('./subscription_test');
const JoinMethodTest = require('./join_method_test');
const OriginTeamPropagates = require('./origin_team_propagates');
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
const AccountIsConnectedTest = require('./account_is_connected_test');
const AccountIsConnectedFalseTest = require('./account_is_connected_false_test');
const AccountIsConnectedByOrgTest = require('./account_is_connected_by_org_test');
const AccountIsConnectedByOrgFalseTest = require('./account_is_connected_by_org_false_test');

class ConfirmationRequestTester {

	confirmationTest () {
		/*
		new ConfirmationTest().test();
		//new ConfirmationWithLinkTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'confirmationCode' }).test();
		new AlreadyRegisteredTest().test();
		new IncorrectCodeTest().test();
		new MaxAttemptsTest().test();
		new ExpirationTest().test();
		new ConfirmationMessageToTeamTest().test();
		//new ConflictingUsernameTest().test();
		//new NoCodestreamUsernameTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new SubscriptionTest({ which: 'user' }).test();
		new SubscriptionTest({ which: 'team' }).test();
		// new SubscriptionTest({ which: 'stream' }).test(); // subscription to stream channels is deprecated
		new JoinMethodTest().test();
		new OriginTeamPropagates().test();
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
		*/
		new AccountIsConnectedTest().test();
		/*
		new AccountIsConnectedFalseTest().test();
		new AccountIsConnectedByOrgTest().test();
		new AccountIsConnectedByOrgFalseTest().test();
		*/
	}
}

module.exports = ConfirmationRequestTester;
