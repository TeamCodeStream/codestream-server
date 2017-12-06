'use strict';

var GetPostsTest = require('./get_posts_test');

class InvalidSeqNumRangeTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid sequence number range is provided';
	}

	setPath (callback) {
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
