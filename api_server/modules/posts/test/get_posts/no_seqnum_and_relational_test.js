'use strict';

const GetPostsTest = require('./get_posts_test');

class NoSeqNumAndRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if a seqnum relational and a regular seqnum are provided in the same query';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide both "before" (a seqnum relational) and "seqnum"
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&before=3&seqnum=3`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'seqNum queries must use seqNum ranges or seqNum relationals but not both'
		};
	}
}

module.exports = NoSeqNumAndRelationalTest;
