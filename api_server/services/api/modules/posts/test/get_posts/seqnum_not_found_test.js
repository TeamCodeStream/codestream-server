'use strict';

var GetPostsTest = require('./get_posts_test');

class SeqNumNotFoundTest extends GetPostsTest {

	get description () {
		return 'should return an error if an unknown sequence number is provided';
	}

	setPath (callback) {
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum&lt=1000`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'POST-1000'
		};
	}
}

module.exports = SeqNumNotFoundTest;
