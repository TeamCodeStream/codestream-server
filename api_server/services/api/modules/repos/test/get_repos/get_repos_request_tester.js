'use strict';

var Get_Repos_By_Team_Test = require('./get_repos_by_team_test');
var Get_Repos_By_Id_Test = require('./get_repos_by_id_test');
var Team_ID_Required_Test = require('./team_id_required_test');
var Get_Repos_Only_From_Team_Test = require('./get_repos_only_from_team_test');
var ACL_Test = require('./acl_test');

class Get_Repos_Request_Tester {

	get_repos_test () {
		new Get_Repos_By_Team_Test().test();
		new Get_Repos_By_Id_Test().test();
		new Team_ID_Required_Test().test();
		new Get_Repos_Only_From_Team_Test().test();
		new ACL_Test().test();
	}
}

module.exports = Get_Repos_Request_Tester;
