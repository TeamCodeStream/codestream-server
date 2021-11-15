'use strict';

const GetChildPostsTest = require('./get_child_posts_test');
const ObjectID = require('mongodb').ObjectID;

class StreamIdNoMatchParentTest extends GetChildPostsTest {

	get description () {
		return 'when fetching child posts of a parent post, stream ID must match the stream of the parent post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'streamId must match the stream of parentPostId'
		};
	}

	// set the path to use in the fetch request
	setPath (callback) {
		super.setPath(() => {
			this.path += `&streamId=${ObjectID()}`;
			callback();
		});
	}
}

module.exports = StreamIdNoMatchParentTest;
