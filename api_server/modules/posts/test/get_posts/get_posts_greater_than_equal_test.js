'use strict';

var GetPostsTest = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class GetPostsGreaterThanEqualTest extends GetPostsTest {

	get description () {
		return 'should return the correct posts when requesting posts in a stream with IDs greater than or equal to some value';
	}

	// set the path to use for the request
	setPath (callback) {
		// pick a pivot point, then filter our expected posts based on that pivot,
		// and specify the gte parameter to fetch based on the pivot
		this.expectedPosts = this.postData.map(postData => postData.post);
		const pivot = this.expectedPosts[2]._id;
		this.expectedPosts = this.expectedPosts.filter(post => ObjectID(post._id) >= ObjectID(pivot));
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&gte=${pivot}`;
		callback();
	}
}

module.exports = GetPostsGreaterThanEqualTest;
