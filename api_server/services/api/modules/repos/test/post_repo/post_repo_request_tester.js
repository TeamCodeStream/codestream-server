'use strict';

var Post_Repo_Test = require('./post_repo_test');
var Post_Repo_No_Attribute_Test = require('./post_repo_no_attribute_test');

class Post_Repo_Request_Tester {

	post_repo_test () {

		new Post_Repo_Test().test();
		new Post_Repo_No_Attribute_Test({ attribute: 'url' }).test();
		new Post_Repo_No_Attribute_Test({ attribute: 'first_commit_sha' }).test();
	}
}

module.exports = Post_Repo_Request_Tester;
