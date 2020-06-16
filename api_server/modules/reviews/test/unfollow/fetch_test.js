'use strict';

const UnfollowTest = require('./unfollow_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UnfollowTest {

	get description () {
		return 'should properly remove the user as a follower of a review when requested, checked by fetching the review';
	}

	run (callback) {
		// run the main test, then fetch the review afterwards
		BoundAsync.series(this, [
			super.run,
			this.fetchReview
		], callback);
	}

	// fetch the review, and verify it has the expected tags
	fetchReview (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/reviews/' + this.review.id,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { review } = response;
				Assert(review.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the before was updated');
				this.expectedReview.modifiedAt = review.modifiedAt;
				Assert.deepEqual(response.review, this.expectedReview, 'fetched review does not have the correct followers');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
