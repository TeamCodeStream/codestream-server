'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_Repo_Post_Test extends Post_Post_Test {

	get type () {
		return 'repo';
	}

	validate_response (data) {
		super.validate_response(data);
		Assert(data.post.repo === this.data.repo, 'repo is not equal to the repo for which the post was created');
	}
}

module.exports = Post_Repo_Post_Test;
