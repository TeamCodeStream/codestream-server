'use strict';

const GetPostsTest = require('./get_posts_test');

class InvalidParameterTest extends GetPostsTest {

	get description () {
		return 'should return an error if an unknown query parameter is provided trying to get a post';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide random parameter "thisparam", which will be rejected
		this.path = `/posts?teamId=${this.team.id}&streamId=${this.teamStream.id}&thisparam=1`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid query parameter'
		};
	}
}

module.exports = InvalidParameterTest;
