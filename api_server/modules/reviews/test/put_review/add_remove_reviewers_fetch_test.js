'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const AddRemoveReviewersTest = require('./add_remove_reviewers_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class AddRemoveReviewersFetchTest extends Aggregation(AddRemoveReviewersTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when reviewers are both added to and removed from the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			this.expectedReview.reviewers = this.review.reviewers;
			this.expectedReview.reviewers.push(...this.addUserIds);
			this.expectedReview.followerIds = this.review.followerIds;
			this.expectedReview.followerIds.push(...this.addUserIds);
			this.removeUserIds.forEach(removeUserId => {
				const index = this.expectedReview.reviewers.findIndex(userId => userId === removeUserId);
				this.expectedReview.reviewers.splice(index, 1);
			});
			this.expectedReview.reviewers.sort();
			this.expectedReview.followerIds.sort();
			callback();
		});
	}

	validateResponse (data) {
		data.review.reviewers.sort();
		data.review.followerIds.sort();
		super.validateResponse(data);
	}
}

module.exports = AddRemoveReviewersFetchTest;
