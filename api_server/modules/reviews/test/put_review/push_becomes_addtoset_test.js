'use strict';

const AddReviewersTest = require('./add_reviewers_test');

class PushBecomesAddToSetTest extends AddReviewersTest {

	get description () {
		return 'should return the updated review and correct directive when adding multiple reviewers to a review, using $push instead of $addToSet';
	}
   
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$push = this.data.$addToSet;
			delete this.data.$addToSet;
			callback();
		});
	}
}

module.exports = PushBecomesAddToSetTest;
