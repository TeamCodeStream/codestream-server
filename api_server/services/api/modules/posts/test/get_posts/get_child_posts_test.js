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

	setPostOptions (n) {
		let postOptions = super.setPostOptions(n);
		if (n > this.whichPostToReplyTo && n % 3 === 0) {
			delete postOptions.wantCodeBlocks;
			postOptions.parentPostId = this.myPosts[this.whichPostToReplyTo]._id;
		}
		return postOptions;
	}

	setPath (callback) {
		let parentPostId = this.myPosts[this.whichPostToReplyTo]._id;
		this.myPosts = this.myPosts.filter(post => post.parentPostId === parentPostId);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&parentPostId=${parentPostId}`;
		callback();
	}
}

module.exports = GetChildPostsTest;
