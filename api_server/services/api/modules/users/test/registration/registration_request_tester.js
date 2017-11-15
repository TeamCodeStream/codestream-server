'use strict';

var RegistrationTest = require('./registration_test');
var NoAttributeTest = require('./no_attribute_test');
var UserExistsTest = require('./user_exists_test');
var RegisteredUserExistsTest = require('./registered_user_exists_test');
var BadEmailTest = require('./bad_email_test');
var BadUsernameTest = require('./bad_username_test');
var BadPasswordTest = require('./bad_password_test');

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
	}
}

module.exports = RegistrationRequestTester;
