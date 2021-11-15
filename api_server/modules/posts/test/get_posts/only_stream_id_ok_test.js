'use strict';

const GetPostsTest = require('./get_posts_test');

class OnlyStreamIdOkTest extends GetPostsTest {

	get description () {
		return 'when fetching posts in a stream, it is ok to pass only the stream ID and not the team ID';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?streamId=${this.teamStream.id}`;
			callback();
		});
	}
}

module.exports = OnlyStreamIdOkTest;
