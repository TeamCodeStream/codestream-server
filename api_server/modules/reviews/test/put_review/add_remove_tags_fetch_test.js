'use strict';

const PutReviewFetchTest = require('./put_review_fetch_test');
const AddRemoveTagsTest = require('./add_remove_tags_test');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');

class AddRemoveTagsFetchTest extends Aggregation(AddRemoveTagsTest, PutReviewFetchTest) {

	get description () {
		return 'should properly update a review when requested, when tags are both added to and removed from the review, checked by fetching the review';
	}

	updateReview (callback) {
		super.updateReview(error => {
			if (error) { return callback(error); }
			this.expectedReview.tags = this.review.tags;
			this.expectedReview.tags.push(...this.addedTags);
			this.removedTags.forEach(removedTag => {
				const index = this.expectedReview.tags.indexOf(removedTag);
				this.expectedReview.tags.splice(index, 1);
			});
			this.expectedReview.tags.sort();
			callback();
		});
	}

	validateResponse (data) {
		data.review.tags.sort();
		super.validateResponse(data);
	}
}

module.exports = AddRemoveTagsFetchTest;
