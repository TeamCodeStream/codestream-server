'use strict';

var GetPostsTest = require('./get_posts_test');

class InvalidIDTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid id is provided with a relational query parameter';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide an invalid ID for the "lt" parameter
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&lt=1`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid id'
		};
	}
}

module.exports = InvalidIDTest;
