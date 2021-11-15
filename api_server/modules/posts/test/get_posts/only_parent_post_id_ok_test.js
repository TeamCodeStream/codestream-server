'use strict';

const GetChildPostsTest = require('./get_child_posts_test');

class OnlyParentPostIdOkTest extends GetChildPostsTest {

	get description () {
		return 'when fetching child posts of a parent post, it is ok to pass only the parent post ID';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		const parentPostId = this.postData[this.whichPostToReplyTo].post.id;
		super.setPath(() => {
			this.path = `/posts?parentPostId=${parentPostId}`;
			callback();
		});
	}
}

module.exports = OnlyParentPostIdOkTest;
