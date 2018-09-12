'use strict';

var GetPostsTest = require('./get_posts_test');

class InvalidSeqNumsTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid sequence number is provided among individual sequence numbers';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide an invalid sequence number (non-numeric), which will be rejected
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=4,x,7`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid sequence number'
		};
	}
}

module.exports = InvalidSeqNumsTest;
