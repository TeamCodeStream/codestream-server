'use strict';

const AmendReviewTest = require('./amend_review_test');

class AmendPushBecomesAddToSetTest extends AmendReviewTest {

	get description () {
		return 'when amending a review with a $push to the changesets, should act just like $addToSet';
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.$push = data.$addToSet;
		delete data.$addToSet;
		return data;
	}
}

module.exports = AmendPushBecomesAddToSetTest;
