'use strict';

const PostPostTest = require('../post_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const ReviewValidator = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/reviews/test/review_validator');

class ReviewTest extends PostPostTest {

	constructor (options) {
		super(options);
		this.streamUpdatesOk = true;
		this.repoOptions.creatorIndex = 1;
	}

	get description () {
		return 'should return the post with a review when creating a post with review info';
	}

	makePostData (callback) {
		BoundAsync.series(this, [
			super.makePostData,
			this.addReviewData
		], callback);
	}

	addReviewData (callback) {
		this.data.review = this.reviewFactory.getRandomReviewData({
			numChanges: 2,
			changesetRepoId: this.repo.id
		});
		callback();
	}

	// validate the response to the post request
	validateResponse (data) {
		// verify we got back an codemark with the attributes we specified
		const inputReview = Object.assign(this.data.review, {
			streamId: this.stream.id,
			postId: data.post.id
		});
		new ReviewValidator({
			test: this,
			inputReview,
			expectedOrigin: this.expectedOrigin,
			expectedOriginDetail: this.expectedOriginDetail,
		}).validateReview(data);
		super.validateResponse(data);
	}
}

module.exports = ReviewTest;
