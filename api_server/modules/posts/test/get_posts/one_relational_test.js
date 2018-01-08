'use strict';

var GetPostsTest = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class OneRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if more than one relational query parameter is provided for a posts query';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide both a "lt" and "gt" parameter, this is not allowed
		let id1 = ObjectID();
		let id2 = ObjectID();
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&lt=${id1}&gt=${id2}`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'only one relational parameter allowed'
		};
	}
}

module.exports = OneRelationalTest;
