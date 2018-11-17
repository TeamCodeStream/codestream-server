'use strict';

const PostPostTest = require('./post_post_test');
const Assert = require('assert');

class PostReplyTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.expectedSeqNum = 2;	// two posts in the stream, overrides the default of 1
		this.expectedVersion = 3;	// stream update will get a version bump
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			Object.assign(this.postOptions, {
				creatorIndex: 1,
				numPosts: 1
			});
			callback();
		});
	}
	get description () {
		return 'should return a valid post when creating a reply post in a file stream';
	}

	// form the data for the post we'll create in the test
	makePostData (callback) {
		super.makePostData(() => {
			// use the ID of the "other post" we created as the parent
			this.data.parentPostId = this.postData[0].post.id;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify we created a post that has the correct post as parent
		const post = data.post;
		Assert(post.parentPostId === this.data.parentPostId, 'parentPostId does not match the ID of the parent post');
		super.validateResponse(data);
	}
}

module.exports = PostReplyTest;
