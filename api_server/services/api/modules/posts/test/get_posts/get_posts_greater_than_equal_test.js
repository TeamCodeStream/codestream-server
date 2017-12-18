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
		let pivot = this.myPosts[2]._id;
		this.myPosts = this.myPosts.filter(post => ObjectID(post._id) >= ObjectID(pivot));
		this.path = `/posts/?teamId=${this.team._id}&streamId=${this.stream._id}&gte=${pivot}`;
		callback();
	}
}

module.exports = GetPostsGreaterThanEqualTest;
