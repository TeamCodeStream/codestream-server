'use strict';

const GetPostsTest = require('./get_posts_test');

class GetPostsBeforeAfterTest extends GetPostsTest {

	constructor (options) {
		super(options);
		this.numPosts = 8;
	}

	get description () {
		return 'should return the correct posts when requesting posts in a stream with a seqnum range';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the before parameter to fetch based on the pivot
		const lowerPivot = this.myPosts[2].seqNum;
		const upperPivot = this.myPosts[5].seqNum;
		this.myPosts = this.myPosts.filter(post => post.seqNum > lowerPivot && post.seqNum < upperPivot);
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&before=${upperPivot}&after=${lowerPivot}`;
		callback();
	}
}

module.exports = GetPostsBeforeAfterTest;
