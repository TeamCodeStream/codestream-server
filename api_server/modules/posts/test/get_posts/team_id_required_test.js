'use strict';

const GetPostsTest = require('./get_posts_test');

class TeamIDRequiredTest extends GetPostsTest {

	get description () {
		return 'should return error if teamId is not provided to posts query';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'teamId'
		};
	}

	setPath (callback) {
		// no teamID in this path...
		this.path = '/posts';
		callback();
	}
}

module.exports = TeamIDRequiredTest;
