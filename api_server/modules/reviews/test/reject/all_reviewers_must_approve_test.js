'use strict';

const ApproveTest = require('./reject_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AllReviewersMustApproveTest extends ApproveTest {

	constructor (options) {
		super(options);
		this.allReviewersMustApprove = true;
		this.expectedVersion = 4;
	}

	get description () {
		return 'should set the status to rejected when a review is set as all-reviewers-must-approve even if only one of the reviewers rejects the review';
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			seriesCallback => {
				this.approveReview(0, seriesCallback);
			},
			seriesCallback => {
				this.approveReview(2, seriesCallback);
			}
		], callback);
	}

	approveReview (userNum, callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/approve/' + this.review.id,
				token: this.users[userNum].accessToken
			},
			callback
		);
	}
}

module.exports = AllReviewersMustApproveTest;
