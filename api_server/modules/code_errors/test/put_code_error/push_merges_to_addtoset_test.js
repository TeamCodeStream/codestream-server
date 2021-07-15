'use strict';

const AddReviewersTest = require('./add_assignees_test');

class PushMergesToAddToSetTest extends AddReviewersTest {

	get description () {
		return 'should return the updated review and correct directive when adding multiple reviewers to a review, using $push and $addToSet';
	}
   
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$push = { reviewers: [this.data.$addToSet.reviewers[0]] };
			this.data.$addToSet.reviewers.splice(0, 1);
			callback();
		});
	}
}

module.exports = PushMergesToAddToSetTest;
