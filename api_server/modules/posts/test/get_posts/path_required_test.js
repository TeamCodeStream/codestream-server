'use strict';

const GetPostsTest = require('./get_posts_test');

class PathRequiredTest extends GetPostsTest {

	get description () {
		return 'should return error if path is not provided with repoId';
	}

	setPath (callback) {
		this.path = `/posts?teamId=${this.team._id}&repoId=${this.repo._id}`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'path'
		};
	}
}

module.exports = PathRequiredTest;
