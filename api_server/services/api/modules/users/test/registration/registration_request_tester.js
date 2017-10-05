'use strict';

var Registration_Test = require('./registration_test');
var Registration_No_Attribute_Test = require('./registration_no_attribute_test');
var Registration_User_Exists_Test = require('./registration_user_exists_test');
var Registration_Bad_Email_Test = require('./registration_bad_email_test');
var Registration_Bad_Username_Test = require('./registration_bad_username_test');
var Registration_Bad_Password_Test = require('./registration_bad_password_test');
var Registration_Email_Becomes_Emails_Test = require('./registration_email_becomes_emails_test');

class Registration_Request_Tester {

	register_test () {
		new Registration_Test().test();
		new Registration_No_Attribute_Test({ attribute: 'emails' }).test();
		new Registration_No_Attribute_Test({ attribute: 'password' }).test();
		new Registration_No_Attribute_Test({ attribute: 'username' }).test();
		new Registration_Email_Becomes_Emails_Test().test();
		new Registration_Bad_Email_Test().test();
		new Registration_Bad_Username_Test().test();
		new Registration_Bad_Password_Test().test();
		new Registration_User_Exists_Test().test();
	}
}

module.exports = Registration_Request_Tester;
