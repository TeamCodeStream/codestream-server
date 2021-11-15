'use strict';

const GetChildPostsTest = require('./get_child_posts_test');

class StreamIdOkWithParentTest extends GetChildPostsTest {

	get description () {
		return 'when fetching child posts of a parent post, stream ID can match the stream of the parent post';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		super.setPath(() => {
			this.path += `&streamId=${this.teamStream.id}`;
			callback();
		});
	}
}

module.exports = StreamIdOkWithParentTest;
