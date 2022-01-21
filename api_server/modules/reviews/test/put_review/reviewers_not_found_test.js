'use strict';

const AddReviewersTest = require('./add_reviewers_test');
const ObjectId = require('mongodb').ObjectId;

class ReviewersNotFound extends AddReviewersTest {

	get description () {
		return 'should return an error when trying to add reviewers to a review when one or more of the reviewers don\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		// substitute bogus reviewers value
		super.makeReviewUpdateData(() => {
			this.data.$addToSet.reviewers.push(ObjectId());
			callback();
		});
	}
}

module.exports = ReviewersNotFound;
