'use strict';

const GetChildPostsTest = require('./get_child_posts_test');
const ObjectId = require('mongodb').ObjectId;

class ParentNotFoundTest extends GetChildPostsTest {

	get description () {
		return 'should return an error when trying to fetch the child posts of a parent post that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'parent post'
		};
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide some random non-existent ID
		const parentPostId = ObjectId();
		this.path = `/posts?teamId=${this.team.id}&parentPostId=${parentPostId}`;
		callback();
	}
}

module.exports = ParentNotFoundTest;
