'use strict';

const AddReviewersTest = require('./add_reviewers_test');

class NoPushPullTest extends AddReviewersTest {

	get description () {
		return 'should return an error when trying to update a review with a $push and a $pull to the reviewers array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$pull = { reviewers: this.data.$addToSet.reviewers[0] };
			callback();
		});
	}
}

module.exports = NoPushPullTest;
