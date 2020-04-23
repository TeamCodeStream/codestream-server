'use strict';

const RejectTest = require('./reject_test');

class ApproveThenRejectTest extends RejectTest {

	get description () {
		return 'should return directive to remove the user\'s approval when rejecting a review that was previously approved by the user';
	}

	init (callback) {
		super.init(error => {
			if (error) { return callback(error); }
			this.doApiRequest(
				{
					method: 'put',
					path: '/reviews/approve/' + this.review.id,
					token: this.currentUser.accessToken
				},
				error => {
					if (error) { return callback(error); }
					this.expectedResponse.review.$unset = {
						[`approvedBy.${this.currentUser.user.id}`]: true
					};
					this.expectedResponse.review.$set.version = 3;
					this.expectedResponse.review.$version = {
						before: 2,
						after: 3
					};
					this.expectedReview.approvedBy = {};
					callback();
				}
			);
		});
	}
}

module.exports = ApproveThenRejectTest;
