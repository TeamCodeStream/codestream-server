'use strict';

var PostRepoTest = require('./post_repo_test');
var NoAttributeTest = require('./no_attribute_test');
var NormalizeUrlTest = require('./normalize_url_test');
var ShaMismatchTest = require('./sha_mismatch_test');
var AlreadyHaveRepoTest = require('./already_have_repo_test');
var AddUsersTest = require('./add_users_test');
var AddUsersUsernameConflictTest = require('./add_users_username_conflict_test');
var AddUsersUniqueUsernamesTest = require('./add_users_unique_usernames_test');
var AlreadyOnTeamTest = require('./already_on_team_test');
var NotOnTeamTest = require('./not_on_team_test');
var AlreadyOnTeamAddUsersTest = require('./already_on_team_add_users_test');
var AlreadyOnTeamAddUsersUniqueUsernamesTest = require('./already_on_team_add_users_unique_usernames_test');
var AlreadyOnTeamAddUsersUsernameConflictTest = require('./already_on_team_add_users_username_conflict_test');
var TeamNotFoundTest = require('./team_not_found_test');
var RepoExistsTest = require('./repo_exists_test');
var RepoExistsAddUsersTest = require('./repo_exists_add_users_test');
var RepoExistsAddUsersUniqueUsernamesTest = require('./repo_exists_add_users_unique_usernames_test');
var RepoExistsAddUsersUsernameConflictTest = require('./repo_exists_add_users_username_conflict_test');
var RepoExistsNotOnTeamTest = require('./repo_exists_not_on_team_test');
var RepoExistsNotOnTeamAddUsersTest = require('./repo_exists_not_on_team_add_users_test');
var RepoExistsNotOnTeamAddUsersUsernameConflictTest = require('./repo_exists_not_on_team_add_users_username_conflict_test');
var RepoExistsNotOnTeamAddUsersUniqueUsernamesTest = require('./repo_exists_not_on_team_add_users_unique_usernames_test');
var NewRepoMessageToTeamTest = require('./new_repo_message_to_team_test');
var NewRepoMessageToOtherUserTest = require('./new_repo_message_to_other_user_test');
var UsersJoinNewTeamMessageTest = require('./users_join_new_team_message_test');
var UsersJoinExistingTeamMessageTest = require('./users_join_existing_team_message_test');
var UsersJoinExistingRepoMessageTest = require('./users_join_existing_repo_message_test');

/* jshint -W071 */

class PostRepoRequestTester {

	postRepoTest () {
		new PostRepoTest().test();
		new NoAttributeTest({ attribute: 'url' }).test();
		new NoAttributeTest({ attribute: 'firstCommitHash' }).test();
		new NormalizeUrlTest().test();
		new ShaMismatchTest().test();
		new AlreadyHaveRepoTest().test();
		new AddUsersTest().test();
		new AddUsersUsernameConflictTest().test();
		new AddUsersUniqueUsernamesTest().test();
		new AlreadyOnTeamTest().test();
		new NotOnTeamTest().test();
		new AlreadyOnTeamAddUsersTest().test();
		new AlreadyOnTeamAddUsersUniqueUsernamesTest().test();
		new AlreadyOnTeamAddUsersUsernameConflictTest().test();
		new TeamNotFoundTest().test();
		new RepoExistsTest().test();
		new RepoExistsAddUsersTest().test();
		new RepoExistsAddUsersUniqueUsernamesTest().test();
		new RepoExistsAddUsersUsernameConflictTest().test();
		new RepoExistsNotOnTeamTest().test();
		new RepoExistsNotOnTeamAddUsersTest().test();
		new RepoExistsNotOnTeamAddUsersUsernameConflictTest().test();
		new RepoExistsNotOnTeamAddUsersUniqueUsernamesTest().test();
		new NewRepoMessageToTeamTest().test();
		new NewRepoMessageToOtherUserTest().test();
		new UsersJoinNewTeamMessageTest().test();
		new UsersJoinExistingTeamMessageTest().test();
		new UsersJoinExistingRepoMessageTest().test();
	}
}

/* jshint +W071 */

module.exports = PostRepoRequestTester;
