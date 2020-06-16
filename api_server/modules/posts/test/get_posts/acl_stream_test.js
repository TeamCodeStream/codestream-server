'use strict';

const GetPostsTest = require('./get_posts_test');

class ACLStreamTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.streamOptions.members = [];
	}

	get description () {
		return 'should return an error when trying to fetch posts from a stream i\'m not a member of';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}
}

module.exports = ACLStreamTest;
