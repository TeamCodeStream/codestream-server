'use strict';

const GetPostsInObjectStreamTest = require('./get_posts_in_object_stream_test');

class ACLObjectStreamTest extends GetPostsInObjectStreamTest {

	constructor (options) {
		super(options);
		this.teamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch posts from an object stream belonging to another team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLObjectStreamTest;
