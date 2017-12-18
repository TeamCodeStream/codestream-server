'use strict';

var GetPostsTest = require('./get_posts_test');

class ACLStreamTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.withoutMeInStream = true;	// without me in the stream, i won't be able to fetch a post
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
