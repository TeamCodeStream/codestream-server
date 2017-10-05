'use strict';

var Post_Repo_Test = require('./post_repo_test');
var No_Attribute_Test = require('./no_attribute_test');
var Normalize_Url_Test = require('./normalize_url_test');
var Sha_Mismatch_Test = require('./sha_mismatch_test');

class Post_Repo_Request_Tester {

	post_repo_test () {

		new Post_Repo_Test().test();
		new No_Attribute_Test({ attribute: 'url' }).test();
		new No_Attribute_Test({ attribute: 'first_commit_sha' }).test();
		new Normalize_Url_Test().test();
		new Sha_Mismatch_Test().test();
	}
}

module.exports = Post_Repo_Request_Tester;
