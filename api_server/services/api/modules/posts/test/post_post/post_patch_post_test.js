'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_Patch_Post_Test extends Post_Post_Test {

	get type () {
		return 'patch';
	}

	validate_response (data) {
		super.validate_response(data);
		super.validate_position(data);
		var post = data.post;
		Assert(post.repo === this.data.repo, 'repo is not equal to the repo for which the post was created');
		Assert(post.path === this.data.path, 'path is not equal to the path for which the post was created');
		Assert(post.patch_id === this.data.patch_id, 'patch_id is not equal to the patch_id for which the post was created');
	}
}

module.exports = Post_Patch_Post_Test;
