'use strict';

const SetCodeStreamPostIdTest = require('./set_codestream_post_id_test');
const ObjectId = require('mongodb').ObjectId;

class PostNotFoundTest extends SetCodeStreamPostIdTest {

	get description () {
		return 'should return an error when trying to connect a codemark to a post and the post doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'post'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.postId = ObjectId(); // substitute an ID for a non-existent post
			callback();
		});
	}
}

module.exports = PostNotFoundTest;
