'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const AddTagsTest = require('./add_tags_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class AddTagsFetchTest extends Aggregation(AddTagsTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when several tags are added to the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			delete this.expectedReview.$addToSet;
			let tags = this.requestData.$addToSet.tags;
			if (!(tags instanceof Array)) {
				tags = [tags];
			}
			this.expectedReview.tags = [
				...(this.review.tags || []),
				...tags
			];
			this.expectedReview.tags.sort();
			callback();
		});
	}

	validateResponse (data) {
		data.review.tags.sort();
		super.validateResponse(data);
	}
}

module.exports = AddTagsFetchTest;
