'use strict';

const GetPostsTest = require('./get_posts_test');

class InvalidSeqNumRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid sequence number is provided along with a relational';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide an invalid sequence number (non-numeric), which will be rejected
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&before=x`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid seqnum'
		};
	}
}

module.exports = InvalidSeqNumRelationalTest;
