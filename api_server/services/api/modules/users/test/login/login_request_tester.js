'use strict';

var Login_Test = require('./login_test');
var Invalid_Password_Test = require('./invalid_password_test');
var Invalid_Email_Test = require('./invalid_email_test');
var No_Attribute_Test = require('./no_attribute_test');

class Login_Request_Tester {

	login_test () {
		new Login_Test().test();
		new No_Attribute_Test({ attribute: 'email' }).test();
		new No_Attribute_Test({ attribute: 'password' }).test();
		new Invalid_Password_Test().test();
		new Invalid_Email_Test().test();
	}
}

module.exports = Login_Request_Tester;
