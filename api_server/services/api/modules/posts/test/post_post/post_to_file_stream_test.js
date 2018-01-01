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

	// form options to use in creating the stream that will be used for the test
	makeStreamOptions (callback) {
		super.makeStreamOptions(() => {
			this.streamOptions.repoId = this.repo._id;	// repoId must be specified for file-type streams
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		let post = data.post;
		Assert(post.repoId === this.repo._id, 'repoId does not match the ID of the repo');
		if (post.commitHashWhenPosted) {
			Assert(post.commitHashWhenPosted === this.data.commitHashWhenPosted.toLowerCase(), 'commitHashWhenPosted does not match');
		}
		super.validateResponse(data);
	}
}

module.exports = PostToFileStreamTest;
