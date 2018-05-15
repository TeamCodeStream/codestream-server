// handle unit tests for the "POST /confirm" request

'use strict';

var ConfirmationTest = require('./confirmation_test');
var NoAttributeTest = require('./no_attribute_test');
var InvalidUserIdTest = require('./invalid_user_id_test');
var EmailMismatchTest = require('./email_mismatch_test');
var AlreadyRegisteredTest = require('./already_registered_test');
var IncorrectCodeTest = require('./incorrect_code_test');
var MaxAttemptsTest = require('./max_attempts_test');
var ExpirationTest = require('./expiration_test');
var ConfirmationMessageToTeamTest = require('./confirmation_message_to_team_test');
var ConfirmationMessageToOtherUserTest = require('./confirmation_message_to_other_user_test');
var ConflictingUsernameTest = require('./conflicting_username_test');
var InitialDataTest = require('./initial_data_test');
var MeAttributesTest = require('./me_attributes_test');
var SubscriptionTest = require('./subscription_test');
var JoinMethodTest = require('./join_method_test');
var OriginTeamPropagates = require('./origin_team_propagates');
var NoUserIdTest = require('./no_user_id_test');

class ConfirmationRequestTester {

	confirmationTest () {
		new ConfirmationTest().test();
//		new NoAttributeTest({ attribute: 'userId' }).test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'confirmationCode' }).test();
		new InvalidUserIdTest().test();
		new EmailMismatchTest().test();
		new AlreadyRegisteredTest().test();
		new IncorrectCodeTest().test();
		new MaxAttemptsTest().test();
		new ExpirationTest().test();
		new ConfirmationMessageToTeamTest().test();
		new ConfirmationMessageToOtherUserTest().test();
		new ConflictingUsernameTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
		new SubscriptionTest({ which: 'user' }).test();
		new SubscriptionTest({ which: 'team' }).test();
		new SubscriptionTest({ which: 'repo' }).test();
		new SubscriptionTest({ which: 'stream' }).test();
		new JoinMethodTest().test();
		new OriginTeamPropagates().test();
		new NoUserIdTest().test();
	}
}

module.exports = ConfirmationRequestTester;
