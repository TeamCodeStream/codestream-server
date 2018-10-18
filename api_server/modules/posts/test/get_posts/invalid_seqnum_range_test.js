'use strict';

const GetPostsTest = require('./get_posts_test');

class InvalidSeqNumRangeTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid sequence number range is provided';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide an invalid sequence number (non-numeric), which will be rejected
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=1-y`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid sequence number'
		};
	}
}

module.exports = InvalidSeqNumRangeTest;
