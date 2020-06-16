'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const RemoveTagsTest = require('./remove_tags_test');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const ArrayUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/array_utilities');

class RemoveTagsFetchTest extends Aggregation(RemoveTagsTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when several tags are removed from the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			delete this.expectedReview.$pull;
			let tags = this.requestData.$pull.tags;
			if (!(tags instanceof Array)) {
				tags = [tags];
			}
			this.expectedReview.tags = ArrayUtilities.difference(this.review.tags, tags);
			this.expectedReview.tags.sort();
			callback();
		});
	}

	validateResponse (data) {
		data.review.tags.sort();
		super.validateResponse(data);
	}
}

module.exports = RemoveTagsFetchTest;
