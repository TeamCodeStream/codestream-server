'use strict';

var Get_My_Repo_Test = require('./get_my_repo_test');
var Get_Other_Repo_Test = require('./get_other_repo_test');
var Not_Found_Test = require('./not_found_test');
var ACL_Test = require('./acl_test');

class Get_Repo_Request_Tester {

	get_repo_test () {
		new Get_My_Repo_Test().test();
		new Get_Other_Repo_Test().test();
		new Not_Found_Test().test();
		new ACL_Test().test();
	}
}

module.exports = Get_Repo_Request_Tester;
