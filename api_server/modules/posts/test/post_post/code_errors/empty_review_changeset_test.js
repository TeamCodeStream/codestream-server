'use strict';

const ReviewTest = require('./review_test');

class EmptyReviewChangesetTest extends ReviewTest {

	get description () {
		return 'should return an error when attempting to create a review with an empty reviewChangesets parameter';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: 'reviewChangesets cannot be empty'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		super.makePostData(() => {
			this.data.review.reviewChangesets = [];
			callback();
		});
	}
}

module.exports = EmptyReviewChangesetTest;
