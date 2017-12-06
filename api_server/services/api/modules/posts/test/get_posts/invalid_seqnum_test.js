'use strict';

var GetPostsTest = require('./get_posts_test');

class InvalidSeqNumTest extends GetPostsTest {

	get description () {
		return 'should return an error if an invalid sequence number is provided';
	}

	setPath (callback) {
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum&lt=x`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'invalid sequence number'
		};
	}
}

module.exports = InvalidSeqNumTest;
