'use strict';

var Registration_Test = require('./registration_test');
var No_Attribute_Test = require('./no_attribute_test');
var User_Exists_Test = require('./user_exists_test');
var Registered_User_Exists_Test = require('./registered_user_exists_test');
var Bad_Email_Test = require('./bad_email_test');
var Bad_Username_Test = require('./bad_username_test');
var Bad_Password_Test = require('./bad_password_test');

class Registration_Request_Tester {

	registration_test () {
		new Registration_Test().test();
		new No_Attribute_Test({ attribute: 'email' }).test();
		new No_Attribute_Test({ attribute: 'password' }).test();
		new No_Attribute_Test({ attribute: 'username' }).test();
		new Bad_Email_Test().test();
		new Bad_Username_Test().test();
		new Bad_Password_Test().test();
		new User_Exists_Test().test();
		new Registered_User_Exists_Test().test();
	}
}

module.exports = Registration_Request_Tester;
