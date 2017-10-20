'use strict';

var Get_Companies_By_Id_Test = require('./get_companies_by_id_test');
var IDs_Required_Test = require('./ids_required_test');
var Get_My_Companies_Test = require('./get_my_companies_test');

class Get_Companies_Request_Tester {

	get_companies_test () {
		new Get_My_Companies_Test().test();
		new Get_Companies_By_Id_Test().test();
		new IDs_Required_Test().test();
	}
}

module.exports = Get_Companies_Request_Tester;
