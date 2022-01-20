'use strict';

const PutReviewTest = require('./put_review_test');
const ObjectId = require('mongodb').ObjectId;

class ReviewNotFoundTest extends PutReviewTest {

	get description () {
		return 'should return an error when trying to update a review that doesn\'t exist';
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
			this.path = '/reviews/' + ObjectId(); // substitute an ID for a non-existent review
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
