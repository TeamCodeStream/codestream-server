'use strict';

var PostPostTest = require('./post_post_test');
var Assert = require('assert');

class PostToFileStreamTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.streamType = 'file';
	}

	get description () {
		return 'should return a valid post when creating a post in a file stream';
	}

	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;
			callback();
		});
	}

	validateResponse (data) {
		let post = data.post;
		Assert(post.repoId === this.repo._id, 'repoId does not match the ID of the repo');
		Assert(post.commitShaWhenPosted === this.data.commitShaWhenPosted, 'commitShaWhenPosted does not match');
		super.validateResponse(data);
	}
}

module.exports = PostToFileStreamTest;
