'use strict';

var Get_My_Team_Test = require('./get_my_team_test');
var Get_Other_Team_Test = require('./get_other_team_test');
var Not_Found_Test = require('./not_found_test');

class Get_Team_Request_Tester {

	get_team_test () {
		new Get_My_Team_Test().test();
		new Get_Other_Team_Test().test();
		new Not_Found_Test().test();
	}
}

module.exports = Get_Team_Request_Tester;
