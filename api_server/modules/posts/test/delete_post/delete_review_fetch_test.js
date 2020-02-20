'use strict';

const DeleteReviewTest = require('./delete_review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const ReviewTestConstants = require(process.env.CS_API_TOP + '/modules/reviews/test/review_test_constants');

class DeleteReviewFetchTest extends DeleteReviewTest {

	get description () {
		return 'should delete associated review when a post is deleted, checked by fetching the review';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { review: ReviewTestConstants.EXPECTED_REVIEW_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deletePost,	// perform the actual deletion
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = '/reviews/' + this.postData[0].review.id;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.review.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was deleted');
		this.expectedReview.modifiedAt = data.review.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.review, this.expectedReview, 'fetched review does not match');
	}
}

module.exports = DeleteReviewFetchTest;
