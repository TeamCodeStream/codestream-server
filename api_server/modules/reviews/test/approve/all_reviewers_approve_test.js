'use strict';

const ApproveTest = require('./approve_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AllReviewersApproveTest extends ApproveTest {

	constructor (options) {
		super(options);
		this.allReviewersMustApprove = true;
		this.expectApproval = true;
		this.expectedVersion = 3;
	}

	get description () {
		return 'should set the status to approved when review is set as all-reviewers-must-approve and the last of the reviewers approves of the review';
	}

	init (callback) {
		BoundAsync.series(this, [
			super.init,
			this.otherUserApproves
		], callback);
	}

	otherUserApproves (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/approve/' + this.review.id,
				token: this.users[2].accessToken
			},
			callback
		);
	}
}

module.exports = AllReviewersApproveTest;
