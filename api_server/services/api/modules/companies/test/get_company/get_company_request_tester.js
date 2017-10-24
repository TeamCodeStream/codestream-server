'use strict';

var Get_My_Company_Test = require('./get_my_company_test');
var Get_Other_Company_Test = require('./get_other_company_test');
var Not_Found_Test = require('./not_found_test');
var ACL_Test = require('./acl_test');

class Get_Company_Request_Tester {

	get_company_test () {
		new Get_My_Company_Test().test();
		new Get_Other_Company_Test().test();
		new Not_Found_Test().test();
		new ACL_Test().test();
	}
}

module.exports = Get_Company_Request_Tester;
