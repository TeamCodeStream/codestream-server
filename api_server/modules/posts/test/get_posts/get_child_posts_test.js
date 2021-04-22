'use strict';

var GetPostsTest = require('./get_posts_test');

class GetChildPostsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.postOptions.numPosts = 10;
		this.whichPostToReplyTo = 2;
		[3, 5, 8].forEach(n => {
			this.postOptions.postData[n] = { replyTo: this.whichPostToReplyTo };
		});
	}

	get description () {
		return 'should return the correct posts when requesting the child posts of a parent';
	}

	// set the path for the request
	setPath (callback) {
		// myPosts will be the posts we expect to get back, look for posts with parentPostId matching the post we replied to
		const parentPostId = this.postData[this.whichPostToReplyTo].post.id;
		this.expectedPosts = this.postData
			.map(postData => postData.post)
			.filter(post => post.parentPostId === parentPostId);
		this.path = `/posts?teamId=${this.team.id}&streamId=${this.teamStream.id}&parentPostId=${parentPostId}`;
		callback();
	}
}

module.exports = GetChildPostsTest;
