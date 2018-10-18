'use strict';

const GetPostsBySeqNumsTest = require('./get_posts_by_seqnums_test');

class NoRangeAndSeqNumsTest extends GetPostsBySeqNumsTest {

	get description () {
		return 'should return an error if a range of sequence numbers and individual sequence numbers are provided in the same request';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide an invalid sequence number (non-numeric), which will be rejected
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=1-2,5-6`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'can not query for range and individual sequence numbers at the same time'
		};
	}
}

module.exports = NoRangeAndSeqNumsTest;
