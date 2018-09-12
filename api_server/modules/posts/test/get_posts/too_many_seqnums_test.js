'use strict';

var GetPostsTest = require('./get_posts_test');

class TooManySeqNumsTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 105;
	}

	get description () {
		return 'should return an error when requesting too many posts at once by sequence number';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'too many sequence numbers'
		};
	}

	// set the path to use for the request
	setPath (callback) {
		// take a slice of sequence numbers that is too big
		let seqNums = this.myPosts.map(post => post.seqNum);
		seqNums = seqNums.slice(2, 103);
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=${seqNums}`;
		callback();
	}
}

module.exports = TooManySeqNumsTest;
