'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const RemoveReviewersTest = require('./remove_assignees_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class RemoveReviewersFetchTest extends Aggregation(RemoveReviewersTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when several reviewers are removed from the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			delete this.expectedReview.$pull;
			let reviewers = this.requestData.$pull.reviewers;
			if (!(reviewers instanceof Array)) {
				reviewers = [reviewers];
			}
			this.expectedReview.reviewers = ArrayUtilities.difference(this.review.reviewers, reviewers);
			this.expectedReview.followerIds = [...this.review.reviewers];
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

module.exports = RemoveReviewersFetchTest;
