'use strict';

const UnreadTest = require('./unread_test');
const ObjectID = require('mongodb').ObjectID;

class PostNotFoundTest extends UnreadTest {

	get description () {
		return 'should return error when user attempts to mark a non-existent post as unread';
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
			this.path = '/unread/' + ObjectID();
			callback();
		});
	}
}

module.exports = PostNotFoundTest;
