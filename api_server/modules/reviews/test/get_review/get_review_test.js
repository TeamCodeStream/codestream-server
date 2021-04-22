'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const ReviewTestConstants = require('../review_test_constants');
const PostTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/test/post_test_constants');

class GetReviewTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		this.repoOptions.creatorIndex = 1;
		Object.assign(this.postOptions, {
			creatorIndex: 1,
			wantReview: true,
			numChanges: 2
		});
	}

	get description () {
		return 'should return the review when requesting a review';
	}

	getExpectedFields () {
		return { review: ReviewTestConstants.EXPECTED_REVIEW_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.setPath			// set the path for the request
		], callback);
	}

	// set the path to use for the request
	setPath (callback) {
		// try to fetch the review
		this.review = this.postData[0].review;
		this.path = '/reviews/' + this.review.id;
		callback();
	}

	// validate the request response
	validateResponse (data) {
		// validate we got the correct review, and that we only got sanitized attributes
		this.validateMatchingObject(this.review.id, data.review, 'review');
		this.validateSanitized(data.review, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);

		// validate we also got the parent post, with only sanitized attributes
		if (this.postData[0]) {
			this.validateMatchingObject(this.postData[0].post.id, data.post, 'post');
			this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		}
	}
}

module.exports = GetReviewTest;
