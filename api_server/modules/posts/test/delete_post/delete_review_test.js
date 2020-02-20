'use strict';

const DeletePostTest = require('./delete_post_test');
const DeepClone = require(process.env.CS_API_TOP + '/server_utils/deep_clone');
const Assert = require('assert');
const ReviewTestConstants = require(process.env.CS_API_TOP + '/modules/reviews/test/review_test_constants');

class DeleteReviewTest extends DeletePostTest {

	get description () {
		return 'should delete associated review when a post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.postOptions.wantReview = true;
			callback();
		});
	}

	setExpectedData (callback) {
		const postData = this.postData[0];
		super.setExpectedData(() => {
			this.expectedData.posts[0].$set.numReplies = 0;
			this.expectedData.reviews = [{
				_id: postData.review.id,	// DEPRECATE ME
				id: postData.review.id,
				$set: {
					deactivated: true,
					modifiedAt: Date.now(),	// placeholder
					numReplies: 0,
					version: 2
				},
				$version: {
					before: 1,
					after: 2
				}
			}];
			this.expectedReview = DeepClone(postData.review);
			Object.assign(this.expectedReview, this.expectedData.reviews[0].$set);
			callback();
		});
	}

	validateResponse (data) {
		const review = data.reviews[0];
		Assert(review.$set.modifiedAt >= this.modifiedAfter, 'review modifiedAt is not greater than before the post was deleted');
		this.expectedData.reviews[0].$set.modifiedAt = review.$set.modifiedAt;
		this.validateSanitized(review.$set, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);
		super.validateResponse(data);
	}
}

module.exports = DeleteReviewTest;
