'use strict';

var Get_Some_Teams_Test = require('./get_some_teams_test');
var IDs_Required_Test = require('./ids_required_test');
var Get_My_Teams_Test = require('./get_my_teams_test');

class Get_Teams_Request_Tester {

	get_teams_test () {
		new Get_My_Teams_Test().test();
		new Get_Some_Teams_Test().test();
		new IDs_Required_Test().test();
	}
}

module.exports = Get_Teams_Request_Tester;
