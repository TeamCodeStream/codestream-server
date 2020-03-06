'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const AddReviewersTest = require('./add_reviewers_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class AddReviewersFetchTest extends Aggregation(AddReviewersTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when several reviewers are added to the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			delete this.expectedReview.$addToSet;
			let reviewers = this.requestData.$addToSet.reviewers;
			if (!(reviewers instanceof Array)) {
				reviewers = [reviewers];
			}
			this.expectedReview.reviewers = [
				...(this.review.reviewers || []),
				...reviewers
			];
			this.expectedReview.followerIds = [
				...(this.review.followerIds || []),
				...reviewers
			];
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

module.exports = AddReviewersFetchTest;
