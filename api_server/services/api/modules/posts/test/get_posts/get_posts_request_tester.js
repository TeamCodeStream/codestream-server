'use strict';

var Get_Some_Posts_Test = require('./get_some_posts_test');
var Get_Posts_IDs_Required_Test = require('./get_posts_ids_required_test');
var Get_Posts_Org_ID_Required_Test = require('./get_posts_org_id_required_test');
var Get_Posts_By_Group_Test = require('./get_posts_by_group_test');
var Get_Posts_By_Parent_Test = require('./get_posts_by_parent_test');
var Get_Posts_By_Repo_Test = require('./get_posts_by_repo_test');
var Get_Posts_By_File_Test = require('./get_posts_by_file_test');
var Get_Posts_By_Commit_Test = require('./get_posts_by_commit_test');
var Get_Posts_By_Patch_Test = require('./get_posts_by_patch_test');
var Get_Posts_By_Diff_Test = require('./get_posts_by_diff_test');
var Get_Posts_By_Org_Test = require('./get_posts_by_org_test');
var Get_My_Posts_Test = require('./get_my_posts_test');
var Get_Posts_By_Creator_Test = require('./get_posts_by_creator_test');
var Get_Posts_By_Newer_Than_Test = require('./get_posts_by_newer_than_test');
var Get_Posts_Invalid_Query_Test = require('./get_posts_invalid_query_test');

class Get_Posts_Request_Tester {

	get_posts_test () {

		new Get_Some_Posts_Test().test();
		new Get_Posts_IDs_Required_Test().test();
		new Get_Posts_Org_ID_Required_Test().test();
		new Get_Posts_By_Group_Test().test();
		new Get_Posts_By_Parent_Test().test();
		new Get_Posts_By_Repo_Test().test();
		new Get_Posts_By_File_Test().test();
		new Get_Posts_By_Commit_Test().test();
		new Get_Posts_By_Patch_Test().test();
		new Get_Posts_By_Diff_Test().test();
		new Get_Posts_By_Org_Test().test();
		new Get_My_Posts_Test().test();
		new Get_Posts_By_Creator_Test().test();
		new Get_Posts_By_Newer_Than_Test().test();
		new Get_Posts_Invalid_Query_Test().test();
	}
}

module.exports = Get_Posts_Request_Tester;
