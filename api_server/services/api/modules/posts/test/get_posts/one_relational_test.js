'use strict';

var GetPostsTest = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class OneRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if more than one relational query parameter is provided for a posts query';
	}

	setPath (callback) {
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
