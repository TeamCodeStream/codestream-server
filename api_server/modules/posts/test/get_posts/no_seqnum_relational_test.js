'use strict';

const GetPostsTest = require('./get_posts_test');

class NoSeqNumRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if a seqnum relational and an ID relational are provided in the same query';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		this.expectedPosts = this.postData.map(postData => postData.post);
		const pivotPost = this.expectedPosts[2];
		// provide both "before" (a seqnum relational) and "lt" (and ID relational)
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&before=3&lt=${pivotPost._id}`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'cannot use relational parameter with seqNum relationals'
		};
	}
}

module.exports = NoSeqNumRelationalTest;
