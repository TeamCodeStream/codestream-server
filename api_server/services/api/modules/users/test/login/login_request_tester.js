'use strict';

var Login_Test = require('./login_test');
var Login_Invalid_Password_Test = require('./login_invalid_password_test');
var Login_Invalid_Email_Test = require('./login_invalid_email_test');
var Login_No_Attribute_Test = require('./login_no_attribute_test');

class Login_Request_Tester {

	login_test () {
		new Login_Test().test();
		new Login_No_Attribute_Test({ attribute: 'email' }).test();
		new Login_No_Attribute_Test({ attribute: 'password' }).test();
		new Login_Invalid_Password_Test().test();
		new Login_Invalid_Email_Test().test();
	}
}

module.exports = Login_Request_Tester;
