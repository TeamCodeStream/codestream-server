'use strict';

const ReadItemTest = require('./read_item_test');
const ObjectID = require('mongodb').ObjectID;

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
			this.path = '/read-item/' + ObjectID();
			callback();
		});
	}
}

module.exports = PostNotFoundTest;
