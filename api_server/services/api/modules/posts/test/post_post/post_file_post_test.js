'use strict';

var Assert = require('assert');
var Post_Post_Test = require('./post_post_test');

class Post_File_Post_Test extends Post_Post_Test {

	get type () {
		return 'file';
	}

	validate_response (data) {
		super.validate_response(data);
		super.validate_position(data);
		let post = data.post;
		Assert(post.repo === this.data.repo, 'repo is not equal to the repo for which the post was created');
		Assert(post.path === this.data.path, 'path is not equal to the path for which the post was created');
	}
}

module.exports = Post_File_Post_Test;
