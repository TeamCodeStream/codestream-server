'use strict';

const AttachToReviewTest = require('./attach_to_review_test');
const ObjectID = require('mongodb').ObjectID;

class ReviewNotFoundTest extends AttachToReviewTest {

	get description () {
		return 'should return an error when attempting to create a codemark and attach it to a review that does not exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'review'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			// substitute a non-existent review ID
			this.data.codemark.reviewId = ObjectID();
			callback();
		});
	}
}

module.exports = ReviewNotFoundTest;
