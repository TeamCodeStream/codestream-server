'use strict';

const AddRemoveReviewersTest = require('./add_remove_reviewers_test');

class NoAddRemoveSameReviewerTest extends AddRemoveReviewersTest {

	get description () {
		return 'should return an error when trying to add and remove the same user for a review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$pull.reviewers.push(this.data.$addToSet.reviewers[1]);
			callback();
		});
	}
}

module.exports = NoAddRemoveSameReviewerTest;
