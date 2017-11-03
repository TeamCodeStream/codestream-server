'use strict';

var Post_Repo_Test = require('./post_repo_test');
var No_Attribute_Test = require('./no_attribute_test');
var Normalize_Url_Test = require('./normalize_url_test');
var Sha_Mismatch_Test = require('./sha_mismatch_test');
var Already_Have_Repo_Test = require('./already_have_repo_test');
var Add_Users_Test = require('./add_users_test');
var Add_Users_Username_Conflict_Test = require('./add_users_username_conflict_test');
var Add_Users_Unique_Usernames_Test = require('./add_users_unique_usernames_test');
var Already_On_Team_Test = require('./already_on_team_test');
var Not_On_Team_Test = require('./not_on_team_test');
var Already_On_Team_Add_Users_Test = require('./already_on_team_add_users_test');
var Already_On_Team_Add_Users_Unique_Usernames_Test = require('./already_on_team_add_users_unique_usernames_test');
var Already_On_Team_Add_Users_Username_Conflict_Test = require('./already_on_team_add_users_username_conflict_test');
var Team_Not_Found_Test = require('./team_not_found_test');
var Repo_Exists_Test = require('./repo_exists_test');
var Repo_Exists_Add_Users_Test = require('./repo_exists_add_users_test');
var Repo_Exists_Add_Users_Unique_Usernames_Test = require('./repo_exists_add_users_unique_usernames_test');
var Repo_Exists_Add_Users_Username_Conflict_Test = require('./repo_exists_add_users_username_conflict_test');
var Repo_Exists_Not_On_Team_Test = require('./repo_exists_not_on_team_test');
var Repo_Exists_Not_On_Team_Add_Users_Test = require('./repo_exists_not_on_team_add_users_test');
var Repo_Exists_Not_On_Team_Add_Users_Username_Conflict_Test = require('./repo_exists_not_on_team_add_users_username_conflict_test');
var Repo_Exists_Not_On_Team_Add_Users_Unique_Usernames_Test = require('./repo_exists_not_on_team_add_users_unique_usernames_test');
var New_Repo_Message_To_Team_Test = require('./new_repo_message_to_team_test');
var New_Repo_Message_To_Other_User_Test = require('./new_repo_message_to_other_user_test');
var Users_Join_New_Team_Message_Test = require('./users_join_new_team_message_test');
var Users_Join_Existing_Team_Message_Test = require('./users_join_existing_team_message_test');
var Users_Join_Existing_Repo_Message_Test = require('./users_join_existing_repo_message_test');

/* jshint -W071 */

class Post_Repo_Request_Tester {

	post_repo_test () {
		new Post_Repo_Test().test();
		new No_Attribute_Test({ attribute: 'url' }).test();
		new No_Attribute_Test({ attribute: 'first_commit_sha' }).test();
		new Normalize_Url_Test().test();
		new Sha_Mismatch_Test().test();
		new Already_Have_Repo_Test().test();
		new Add_Users_Test().test();
		new Add_Users_Username_Conflict_Test().test();
		new Add_Users_Unique_Usernames_Test().test();
		new Already_On_Team_Test().test();
		new Not_On_Team_Test().test();
		new Already_On_Team_Add_Users_Test().test();
		new Already_On_Team_Add_Users_Unique_Usernames_Test().test();
		new Already_On_Team_Add_Users_Username_Conflict_Test().test();
		new Team_Not_Found_Test().test();
		new Repo_Exists_Test().test();
		new Repo_Exists_Add_Users_Test().test();
		new Repo_Exists_Add_Users_Unique_Usernames_Test().test();
		new Repo_Exists_Add_Users_Username_Conflict_Test().test();
		new Repo_Exists_Not_On_Team_Test().test();
		new Repo_Exists_Not_On_Team_Add_Users_Test().test();
		new Repo_Exists_Not_On_Team_Add_Users_Username_Conflict_Test().test();
		new Repo_Exists_Not_On_Team_Add_Users_Unique_Usernames_Test().test();
		new New_Repo_Message_To_Team_Test().test();
		new New_Repo_Message_To_Other_User_Test().test();
		new Users_Join_New_Team_Message_Test().test();
		new Users_Join_Existing_Team_Message_Test().test();
		new Users_Join_Existing_Repo_Message_Test().test();

	}
}

/* jshint +W071 */

module.exports = Post_Repo_Request_Tester;
