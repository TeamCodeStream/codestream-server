'use strict';

const GetPostsTest = require('./get_posts_test');

class InvalidSeqNumTest extends GetPostsTest {

	get description () {
		return 'should return an error when trying to fetch posts using an invalid sequence number';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid seqnum'
		};
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide some invalid sequence number with before parameter
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&before=x`;
		callback();
	}
}

module.exports = InvalidSeqNumTest;
