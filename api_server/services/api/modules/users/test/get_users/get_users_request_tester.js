'use strict';

var Get_Users_By_Id_Test = require('./get_users_by_id_test');
var Team_ID_Required_Test = require('./team_id_required_test');
var Get_Users_By_Team_Id_Test = require('./get_users_by_team_id_test');
var ACL_Test = require('./acl_test');
var Get_Users_Only_From_Team_Test = require('./get_users_only_from_team_test');

class Get_Users_Request_Tester {

	get_users_test () {
		new Get_Users_By_Id_Test().test();
		new Get_Users_By_Team_Id_Test().test();
		new Team_ID_Required_Test().test();
		new ACL_Test().test();
		new Get_Users_Only_From_Team_Test().test();
	}
}

module.exports = Get_Users_Request_Tester;
