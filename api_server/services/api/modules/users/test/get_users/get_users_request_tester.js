'use strict';

var Get_Users_By_Id_Test = require('./get_users_by_id_test');
var IDs_Required_Test = require('./ids_required_test');

class Get_Users_Request_Tester {

	get_users_test () {
		new Get_Users_By_Id_Test().test();
		new IDs_Required_Test().test();
	}
}

module.exports = Get_Users_Request_Tester;
