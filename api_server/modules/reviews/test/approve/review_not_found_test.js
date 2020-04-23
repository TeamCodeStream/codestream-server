'use strict';

const ApproveTest = require('./approve_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends ApproveTest {

	get description () {
		return 'should return an error when trying to approve a non-existent review';
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
			this.path = `/reviews/approve/${ObjectID()}`;
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
