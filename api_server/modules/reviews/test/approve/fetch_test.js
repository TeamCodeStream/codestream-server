'use strict';

const ApproveTest = require('./approve_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ApproveTest {

	get description () {
		return 'should properly add the user\'s approval to a review when requested, checked by fetching the review';
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
				Assert(review.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the review was updated');
				this.expectedReview.modifiedAt = review.modifiedAt;
				Assert(review.approvedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the review was updated');
				this.expectedReview.approvedAt = review.approvedAt;
				Assert(review.approvedBy[this.currentUser.user.id].approvedAt >= this.modifiedAfter, 'approvedAt is not greater than before the review was updated');
				this.expectedReview.approvedBy[this.currentUser.user.id].approvedAt = review.approvedBy[this.currentUser.user.id].approvedAt;
				Assert.deepEqual(response.review, this.expectedReview, 'fetched review does not have the correct approvals');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
