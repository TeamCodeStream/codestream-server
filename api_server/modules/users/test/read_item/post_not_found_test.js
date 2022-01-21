'use strict';

const ReadItemTest = require('./read_item_test');
const ObjectId = require('mongodb').ObjectId;

class PostNotFoundTest extends ReadItemTest {

	get description () {
		return 'should return error when user attempts to mark last item read for a non-existent post';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'post'
		};
	}

	// before the test runs...
	before (callback) {
		// run usual setup, but substitute a bogus post ID
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/read-item/' + ObjectId();
			callback();
		});
	}
}

module.exports = PostNotFoundTest;
