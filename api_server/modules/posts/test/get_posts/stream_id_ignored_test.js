'use strict';

const GetPostsTest = require('./get_posts_test');
const ObjectID = require('mongodb').ObjectID;

class StreamIdIgnoredTest extends GetPostsTest {

	get description () {
		return 'should ignore requests to fetch posts by stream, which is deprecated';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		super.setPath(() => {
			this.path = `/posts?teamId=${this.team.id}&streamId=${ObjectID()}`;
			callback();
		});
	}
}

module.exports = StreamIdIgnoredTest;
