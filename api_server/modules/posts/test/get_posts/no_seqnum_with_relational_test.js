'use strict';

const GetPostsTest = require('./get_posts_test');
const ObjectID = require('mongodb').ObjectID;

class NoSeqNumWithRelationalTest extends GetPostsTest {

	get description () {
		return 'should return an error if both seqnum and a relational query parameter is provided';
	}

	// set the path to use in the fetch request
	setPath (callback) {
		// provide a "gt" parameter, which is not allowed in conjunction with a seqnum parameter
		const id = ObjectID();
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
