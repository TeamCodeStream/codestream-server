'use strict';

const GetChildPostsTest = require('./get_child_posts_test');

class GetRepliesToCodeErrorTest extends GetChildPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.claimCodeErrors = true;
		this.postOptions.postData[this.whichPostToReplyTo] = { wantCodeError: true };
	}

	get description () {
		return 'should return the correct posts when requesting replies to a code error, specified by parent post';
	}

	// set the path for the request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?parentPostId=${this.postData[this.whichPostToReplyTo].post.id}`;
			callback();
		});
	}
}

module.exports = GetRepliesToCodeErrorTest;
