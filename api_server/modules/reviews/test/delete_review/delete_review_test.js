// base class for many tests of the "DELETE /reviews/:id" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const ReviewTestConstants = require('../review_test_constants');
const PostTestConstants = require(process.env.CS_API_TOP + '/modules/posts/test/post_test_constants');

class DeleteReviewTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated review and associated post when deleting a review';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}
	
	// validate the response to the test request
	validateResponse (data) {
		const review = data.reviews[0];
		const post = data.posts[0];
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(review.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt for the review is not greater than before the review was deleted');
		Assert(post.$set.modifiedAt >= this.modifiedAfter, 'review modifiedAt is not greater than before the post was deleted');
		this.expectedData.reviews[0].$set.modifiedAt = review.$set.modifiedAt;
		this.expectedData.posts[0].$set.modifiedAt = post.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the post and review in the response has no attributes that should not go to clients
		this.validateSanitized(post.$set, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(review.$set, ReviewTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteReviewTest;
