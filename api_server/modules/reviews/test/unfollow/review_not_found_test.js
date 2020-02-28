'use strict';

const UnfollowTest = require('./unfollow_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends UnfollowTest {

	get description () {
		return 'should return an error when trying to unfollow a non-existent review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'review'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			// substitute an ID for a non-existent review
			this.path = `/reviews/unfollow/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
