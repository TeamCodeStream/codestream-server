'use strict';

const NumRepliesTest = require('./num_replies_test');
const Assert = require('assert');

class NumRepliesReviewTest extends NumRepliesTest {

	get description () {
		return 'should decrement numReplies for the parent post\'s review when the child post is deleted';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.repoOptions.creatorIndex = 1;
			Object.assign(this.postOptions.postData[0], {
				wantReview: true,
				numChanges: 2
			});
			callback();
		});
	}

	setExpectedData (callback) {
		super.setExpectedData(() => {
			this.expectedData.reviews = [{
				_id: this.postData[0].review.id,	// DEPRECATE ME
				id: this.postData[0].review.id,
				$set: {
					numReplies: 2,
					version: 5
				},
				$version: {
					before: 4,
					after: 5
				}
			}];
			callback();
		});
	}

	validateResponse (data) {
		const dataReview = data.reviews.find(review => review.id === this.postData[0].review.id);
		Assert(dataReview.$set.modifiedAt >= this.updatedAt, 'modifiedAt not changed');
		const expectedReview = this.expectedData.reviews.find(review => review.id === this.postData[0].review.id);
		expectedReview.$set.modifiedAt = dataReview.$set.modifiedAt;
		return super.validateResponse(data);
	}
}

module.exports = NumRepliesReviewTest;
