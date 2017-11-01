'use strict';

var Confirmation_Test = require('./confirmation_test');
var No_Attribute_Test = require('./no_attribute_test');
var Invalid_User_Id_Test = require('./invalid_user_id_test');
var Email_Mismatch_Test = require('./email_mismatch_test');
var Already_Registered_Test = require('./already_registered_test');
var Incorrect_Code_Test = require('./incorrect_code_test');
var Max_Attempts_Test = require('./max_attempts_test');
var Expiration_Test = require('./expiration_test');

class Confirmation_Request_Tester {

	confirmation_test () {
		new Confirmation_Test().test();
		new No_Attribute_Test({ attribute: 'user_id' }).test();
		new No_Attribute_Test({ attribute: 'email' }).test();
		new No_Attribute_Test({ attribute: 'confirmation_code' }).test();
		new Invalid_User_Id_Test().test();
		new Email_Mismatch_Test().test();
		new Already_Registered_Test().test();
		new Incorrect_Code_Test().test();
		new Max_Attempts_Test().test();
		new Expiration_Test().test();
	}
}

module.exports = Confirmation_Request_Tester;
