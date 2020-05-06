'use strict';

const AmendReviewTest = require('./amend_review_test');

class NoAmendPullTest extends AmendReviewTest {

	get description () {
		return 'should return an error when trying to $pulll from reviewChangesets';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	getReviewUpdateData () {
		const data = super.getReviewUpdateData();
		data.$pull = data.$addToSet;
		delete data.$addToSet;
		return data;
	}
}

module.exports = NoAmendPullTest;
