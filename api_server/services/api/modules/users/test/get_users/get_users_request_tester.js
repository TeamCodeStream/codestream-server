'use strict';

var Get_Some_Users_Test = require('./get_some_users_test');
var Get_Users_IDs_Required_Test = require('./get_users_ids_required_test');

class Get_Users_Request_Tester {

	get_users_test () {
		new Get_Some_Users_Test().test();
		new Get_Users_IDs_Required_Test().test();
	}
}

module.exports = Get_Users_Request_Tester;
