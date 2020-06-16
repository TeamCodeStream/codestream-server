'use strict';

const FollowTest = require('./follow_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends FollowTest {

	get description () {
		return 'should return an error when trying to follow a non-existent review';
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
			this.path = `/reviews/follow/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
