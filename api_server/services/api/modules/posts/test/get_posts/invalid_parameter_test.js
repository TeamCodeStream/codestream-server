'use strict';

var GetPostsTest = require('./get_posts_test');

class InvalidParameterTest extends GetPostsTest {

	get description () {
		return 'should return an error if an unknown query parameter is provided';
	}

	setPath (callback) {
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&thisparam=1`;
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
