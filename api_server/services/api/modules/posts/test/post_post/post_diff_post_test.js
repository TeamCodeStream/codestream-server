'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_Diff_Post_Test extends Post_Post_Test {

	get type () {
		return 'diff';
	}

	validate_response (data) {
		super.validate_response(data);
		super.validate_position(data);
		var post = data.post;
		Assert(post.repo === this.data.repo, 'repo is not equal to the repo for which the post was created');
		Assert(post.path === this.data.path, 'path is not equal to the path for which the post was created');
		Assert(post.diff_id === this.data.diff_id, 'diff_id is not equal to the diff_id for which the post was created');
	}
}

module.exports = Post_Diff_Post_Test;
