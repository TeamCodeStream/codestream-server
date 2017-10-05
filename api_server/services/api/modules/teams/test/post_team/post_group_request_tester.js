'use strict';

var Post_Team_Test = require('./post_team_test');
var Post_Team_Default_Member_IDs_Test = require('./post_team_default_member_ids_test');
var Post_Team_Invalid_Member_IDs_Test = require('./post_team_invalid_member_ids_test');
var Post_Team_User_Should_Be_Member_Test = require('./post_team_user_should_be_member_test');
var Post_Team_Default_Org_ID_Test = require('./post_team_default_org_id_test');
var Post_Team_No_Org_ID_Test = require('./post_team_no_org_id_test');
var Post_Team_Named_Team_Exists_Test = require('./post_team_named_team_exists_test');
var Post_Team_Find_Existing_Test = require('./post_team_find_existing_test');

class Post_Team_Request_Tester {

	post_team_test () {

		new Post_Team_Test().test();
		new Post_Team_Test({ random_name: true }).test();
		new Post_Team_Default_Member_IDs_Test().test();
		new Post_Team_Invalid_Member_IDs_Test().test();
		new Post_Team_User_Should_Be_Member_Test().test();
		new Post_Team_Default_Org_ID_Test().test();
		new Post_Team_No_Org_ID_Test().test();
		new Post_Team_Named_Team_Exists_Test().test();
		new Post_Team_Find_Existing_Test().test();
	}
}

module.exports = Post_Team_Request_Tester;
