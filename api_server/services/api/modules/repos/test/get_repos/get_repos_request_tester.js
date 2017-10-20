'use strict';

var Get_Repos_By_Team_Test = require('./get_repos_by_team_test');
var Get_Repos_By_Id_Test = require('./get_repos_by_id_test');
var IDs_Required_Test = require('./ids_required_test');

class Get_Repos_Request_Tester {

	get_repos_test () {
		new Get_Repos_By_Team_Test().test();
		new Get_Repos_By_Id_Test().test();
		new IDs_Required_Test().test();
	}
}

module.exports = Get_Repos_Request_Tester;
