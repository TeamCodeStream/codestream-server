'use strict';

const GetChildPostsTest = require('./get_child_posts_test');
const Assert = require('assert');

class GetRepliesToCodeErrorTest extends GetChildPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.creatorIndex = 0;
		this.postOptions.postData[this.whichPostToReplyTo] = { wantCodeError: true };
	}

	get description () {
		return 'should return the correct posts with code errors when requesting posts created with code errors';
	}

	// set the path for the request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?codeErrorId=${this.postData[this.whichPostToReplyTo].post.codeErrorId}`;
			callback();
		});
	}

	// validate the response to the fetch request
	validateResponse (data) {
		/*
		data.posts.forEach(post => {
			const codeError = data.codeErrors.find(codeError => codeError.id === post.codeErrorId);
			Assert(codeError, 'code error not returned with post');
		});*/

		super.validateResponse(data);
	}
}

module.exports = GetRepliesToCodeErrorTest;
