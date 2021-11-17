'use strict';

const GetRepliesToCodeErrorTest = require('./get_replies_to_code_error_test');

class GetPostsInObjectStreamTest extends GetRepliesToCodeErrorTest {

	constructor (options) {
		super(options);
		this.postOptions.postData[this.whichPostToReplyTo] = { wantCodeError: true };
	}

	get description () {
		return 'should return the correct posts when requesting posts from an object stream';
	}

	// set the path for the request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?teamId=${this.team.id}&streamId=${this.postData[this.whichPostToReplyTo].post.streamId}`;
			this.expectedPosts.push(this.postData[this.whichPostToReplyTo].post);
			callback();
		});
	}
}

module.exports = GetPostsInObjectStreamTest;
