'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');

class PostToFileStreamTest extends PostPostTest {

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			this.streamOptions.type = 'file';
			callback();
		});
	}

	get description () {
		return 'should return a valid post when creating a post in a file stream';
	}

	// validate the response to the test request
	validateResponse (data) {
		const post = data.post;
		Assert(post.repoId === this.repo._id, 'repoId does not match the ID of the repo');
		if (post.commitHashWhenPosted) {
			Assert(post.commitHashWhenPosted === this.data.commitHashWhenPosted.toLowerCase(), 'commitHashWhenPosted does not match');
		}
		super.validateResponse(data);
	}
}

module.exports = PostToFileStreamTest;
