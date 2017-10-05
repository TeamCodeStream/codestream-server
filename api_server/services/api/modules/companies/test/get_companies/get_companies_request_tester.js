'use strict';

var Get_Some_Companies_Test = require('./get_some_companies_test');
var Get_Companies_IDs_Required_Test = require('./get_companies_ids_required_test');
var Get_My_Companies_Test = require('./get_my_companies_test');

class Get_Companies_Request_Tester {

	get_companies_test () {
		new Get_Some_Companies_Test().test();
		new Get_Companies_IDs_Required_Test().test();
		new Get_My_Companies_Test().test();
	}
}

module.exports = Get_Companies_Request_Tester;
