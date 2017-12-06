'use strict';

var GetPostsTest = require('./get_posts_test');
var ObjectID = require('mongodb').ObjectID;

class NoSeqNumWithRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if both seqnum and a relational query parameter is provided';
	}

	setPath (callback) {
		let id = ObjectID();
		this.path = `/posts?teamId=${this.team._id}&streamId=${this.stream._id}&seqnum=1&gt=${id}`;
		callback();
	}

	getExpectedError () {
		return {
			code: 'RAPI-1006',
			reason: 'can not query sequence numbers with a relational'
		};
	}
}

module.exports = NoSeqNumWithRelationalTest;
