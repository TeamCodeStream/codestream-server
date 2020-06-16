'use strict';

const DeleteReviewTest = require('./delete_review_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const ReviewTestConstants = require('../review_test_constants');

class DeleteReviewFetchTest extends DeleteReviewTest {

	get description () {
		return 'should properly deactivate a review when deleted, checked by fetching the review';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { review: ReviewTestConstants.EXPECTED_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deleteReview	// perform the actual deletion
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.review.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was updated');
		this.expectedReview.modifiedAt = data.review.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.review, this.expectedReview, 'fetched review does not match');
	}
}

module.exports = DeleteReviewFetchTest;
