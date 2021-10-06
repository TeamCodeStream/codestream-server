'use strict';

const GetPostsTest = require('./get_posts_test');

class StreamIdInvalidTest extends GetPostsTest {

	get description () {
		return 'should return an error when trying to fetch posts by stream, which is deprecated';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'streamId'
		};
	}

	// set the path to use in the fetch request
	setPath (callback) {
		this.path = `/posts?teamId=${this.team.id}&streamId=${this.teamStream.id}`;
		callback();
	}
}

module.exports = StreamIdInvalidTest;
