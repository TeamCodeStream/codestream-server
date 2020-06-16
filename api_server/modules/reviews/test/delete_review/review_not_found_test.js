'use strict';

const DeleteReviewTest = require('./delete_review_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends DeleteReviewTest {

	get description () {
		return 'should return an error when trying to delete a review that doesn\'t exist';
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
			this.path = '/reviews/' + ObjectID(); // substitute an ID for a non-existent review
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
