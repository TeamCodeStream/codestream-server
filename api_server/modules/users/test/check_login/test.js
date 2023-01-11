// handle unit tests for the "PUT /no-auth/check-login" request, to check login credentials

'use strict';

const CheckLoginTest = require('./check_login_test');
const InvalidPasswordTest = require('./invalid_password_test');
const InvalidEmailTest = require('./invalid_email_test');
const NoAttributeTest = require('./no_attribute_test');
const NoLoginUnregisteredTest = require('./no_login_unregistered_test');
const NoPasswordTest = require('./no_password_test');
const UnregisteredInvalidPasswordTest = require('./unregistered_invalid_password_test');

class CheckLoginRequestTester {

	test () {
 		new CheckLoginTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'password' }).test();
		new InvalidPasswordTest().test();
		new InvalidEmailTest().test();
		new NoLoginUnregisteredTest().test();
		new NoPasswordTest().test();
		new UnregisteredInvalidPasswordTest().test();
	}
}

module.exports = new CheckLoginRequestTester();
