'use strict';

var Confirmation_Test = require('./confirmation_test');
var Confirmation_No_Attribute_Test = require('./confirmation_no_attribute_test');
var Confirmation_Invalid_User_Id_Test = require('./confirmation_invalid_user_id_test');
var Confirmation_Email_Mismatch_Test = require('./confirmation_email_mismatch_test');
var Confirmation_Already_Registered_Test = require('./confirmation_already_registered_test');
var Confirmation_Incorrect_Code_Test = require('./confirmation_incorrect_code_test');
var Confirmation_Max_Attempts_Test = require('./confirmation_max_attempts_test');
var Confirmation_Expiration_Test = require('./confirmation_expiration_test');

class Confirmation_Request_Tester {

	confirmation_test () {
		new Confirmation_Test().test();
		new Confirmation_No_Attribute_Test({ attribute: 'user_id' }).test();
		new Confirmation_No_Attribute_Test({ attribute: 'email' }).test();
		new Confirmation_No_Attribute_Test({ attribute: 'confirmation_code' }).test();
		new Confirmation_Invalid_User_Id_Test().test();
		new Confirmation_Email_Mismatch_Test().test();
		new Confirmation_Already_Registered_Test().test();
		new Confirmation_Incorrect_Code_Test().test();
		new Confirmation_Max_Attempts_Test().test();
		new Confirmation_Expiration_Test().test();
	}
}

module.exports = Confirmation_Request_Tester;
