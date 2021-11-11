'use strict';

const GetChildPostsTest = require('./get_child_posts_test');
const ObjectID = require('mongodb').ObjectID;

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
		const parentPostId = ObjectID();
		this.path = `/posts?teamId=${this.team.id}&parentPostId=${parentPostId}`;
		callback();
	}
}

module.exports = ParentNotFoundTest;
