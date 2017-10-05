'use strict';

var Post_Group_Post_Test = require('./post_group_post_test');
var Post_Reply_Post_Test = require('./post_reply_post_test');
var Post_Repo_Post_Test = require('./post_repo_post_test');
var Post_File_Post_Test = require('./post_file_post_test');
var Post_Commit_Post_Test = require('./post_commit_post_test');
var Post_Diff_Post_Test = require('./post_diff_post_test');
var Post_Patch_Post_Test = require('./post_patch_post_test');
var Post_Post_Org_ID_Required_Test = require('./post_post_org_id_required_test');
var Post_Post_On_The_Fly_Group_Test = require('./post_post_on_the_fly_group_test');
var Post_Post_Find_Existing_Group_Test = require('./post_post_find_existing_group_test');
var Post_Post_Invalid_Group_Test = require('./post_post_invalid_group_test');

class Post_Post_Request_Tester {

	post_post_test () {
		new Post_Group_Post_Test().test();
		new Post_Reply_Post_Test().test();
		new Post_Repo_Post_Test().test();
		new Post_File_Post_Test().test();
		new Post_Commit_Post_Test().test();
		new Post_Diff_Post_Test().test();
		new Post_Patch_Post_Test().test();
		new Post_Post_Org_ID_Required_Test().test();
		new Post_Post_On_The_Fly_Group_Test().test();
		new Post_Post_Find_Existing_Group_Test().test();
		new Post_Post_Invalid_Group_Test().test();
	}
}

module.exports = Post_Post_Request_Tester;
