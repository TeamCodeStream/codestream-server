'use strict';

var LoginTest = require('./login_test');
var InvalidPasswordTest = require('./invalid_password_test');
var InvalidEmailTest = require('./invalid_email_test');
var NoAttributeTest = require('./no_attribute_test');
var InitialDataTest = require('./initial_data_test');
var MeAttributesTest = require('./me_attributes_test');

class LoginRequestTester {

	loginTest () {
		new LoginTest().test();
		new NoAttributeTest({ attribute: 'email' }).test();
		new NoAttributeTest({ attribute: 'password' }).test();
		new InvalidPasswordTest().test();
		new InvalidEmailTest().test();
		new InitialDataTest().test();
		new MeAttributesTest().test();
	}
}

module.exports = LoginRequestTester;
