'use strict';

var RegistrationTest = require('./registration_test');
var NoAttributeTest = require('./no_attribute_test');
var UserExistsTest = require('./user_exists_test');
var RegisteredUserExistsTest = require('./registered_user_exists_test');
var BadEmailTest = require('./bad_email_test');
var BadUsernameTest = require('./bad_username_test');
var BadPasswordTest = require('./bad_password_test');
var ConflictingUsernameTest = require('./conflicting_username_test');
var UserMessageToTeamTest = require('./user_message_to_team_test');
var UserMessageToOtherUserTest = require('./user_message_to_other_user_test');
var ConfirmationEmailTest = require('./confirmation_email_test');
//var NoBetaCodeTest = require('./no_beta_code_test');
//var InvalidBetaCodeTest = require('./invalid_beta_code_test');
var PreferencesTest = require('./preferences_test');

class RegistrationRequestTester {

	registrationTest () {
		new RegistrationTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'password' }).test();
		new NoAttributeTest({ attribute: 'username' }).test();
		new BadEmailTest().test();
		new BadUsernameTest().test();
		new BadPasswordTest().test();
		new UserExistsTest().test();
		new RegisteredUserExistsTest().test();
		new ConflictingUsernameTest().test();
		new UserMessageToTeamTest().test();
		new UserMessageToOtherUserTest().test();
		new ConfirmationEmailTest().test();
//		new NoBetaCodeTest().test();
//		new InvalidBetaCodeTest().test();
		new PreferencesTest().test();
	}
}

module.exports = RegistrationRequestTester;
