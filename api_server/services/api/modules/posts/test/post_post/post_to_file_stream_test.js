'use strict';

var Post_Post_Test = require('./post_post_test');
var Assert = require('assert');

class Post_To_File_Stream_Test extends Post_Post_Test {

	constructor (options) {
		super(options);
		this.stream_type = 'file';
	}

	get description () {
		return 'should return a valid post when creating a post in a file stream';
	}

	make_stream_options (callback) {
		super.make_stream_options(() => {
			this.stream_options.repo_id = this.repo._id;
			callback();
		});
	}

	validate_response (data) {
		let post = data.post;
		Assert(post.repo_id === this.repo._id, 'repo_id does not match the ID of the repo');
		Assert(post.commit_sha_when_posted === this.data.commit_sha_when_posted, 'commit_sha_when_posted does not match');
		super.validate_response(data);
	}
}

module.exports = Post_To_File_Stream_Test;
