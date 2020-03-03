'use strict';

const AddReviewerTest = require('./add_reviewer_test');

class ReviewersNotArrayTest extends AddReviewerTest {

	get description () {
		return 'should return an error when trying to update a review with a reviewers attribute that is not a string or array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		// substitute bogus reviewers value
		super.makeReviewUpdateData(() => {
			this.data.$addToSet.reviewers = 1;
			callback();
		});
	}
}

module.exports = ReviewersNotArrayTest;
