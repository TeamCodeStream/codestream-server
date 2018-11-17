'use strict';

const GetPostsTest = require('./get_posts_test');

class StreamIDRequiredTest extends GetPostsTest {

	get description () {
		return 'should return error if streamId is not provided';
	}

	setPath (callback) {
		this.path = '/posts?teamId=' + this.team.id;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'streamId'
		};
	}
}

module.exports = StreamIDRequiredTest;
