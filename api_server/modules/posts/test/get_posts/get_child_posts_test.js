'use strict';

var GetPostsTest = require('./get_posts_test');

class GetChildPostsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 10;
		this.whichPostToReplyTo = 2;
	}

	get description () {
		return 'should return the correct posts when requesting the child posts of a parent';
	}

	// set the options to use when creating the test post
	setPostOptions (n) {
		let postOptions = super.setPostOptions(n);
		if (n > this.whichPostToReplyTo && n % 3 === 0) {
			// 10 posts total, we'll make every third post past the one we're replying to a reply
			delete postOptions.wantCodeBlocks;	// no need to do code blocks for replies (though it is allowed)
			postOptions.parentPostId = this.myPosts[this.whichPostToReplyTo]._id;
		}
		return postOptions;
	}

	// set the path for the request
	setPath (callback) {
		// myPosts will be the posts we expect to get back, look for posts with parentPostId matching the post we replied to
		let parentPostId = this.myPosts[this.whichPostToReplyTo]._id;
		this.myPosts = this.myPosts.filter(post => post.parentPostId === parentPostId);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&parentPostId=${parentPostId}`;
		callback();
	}
}

module.exports = GetChildPostsTest;
