'use strict';

const ReopenTest = require('./reopen_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends ReopenTest {

	get description () {
		return 'should properly update the review\'s status when reopened, checked by fetching the review';
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
				if (!this.rejectToClose) {
					const userId = this.users[1].user.id;
					Assert(response.review.approvedBy[userId].approvedAt >= this.review.createdAt, 'approvedAt should be greater than or equal to when the review was created');
					this.expectedReview.approvedBy = {
						[this.users[1].user.id]: {
							approvedAt: response.review.approvedBy[this.users[1].user.id].approvedAt
						}
					};
				}
				Assert.deepEqual(response.review, this.expectedReview, 'fetched review does not have the correct approvals');
				callback();
			}
		);
	}
}

module.exports = FetchTest;
