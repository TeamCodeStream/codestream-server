'use strict';

const PutReviewTest = require('./put_review_test');

class AddTagTest extends PutReviewTest {

	get description () {
		return 'should return the updated review and directive when adding a tag to a review';
	}
   
	// form the data for the stream update
	makeReviewUpdateData (callback) {
		// find one of the other tags in the team, and add them to the stream
		super.makeReviewUpdateData(() => {
			this.addedTags = this.getAddedTags();
			this.expectedData.review.$addToSet = this.expectedData.review.$addToSet || {};
			if (this.addedTags.length === 1) {
				// this tests conversion of single element to an array
				const addedTag = this.addedTags[0];
				this.data.$addToSet = { tags: addedTag };
				this.expectedData.review.$addToSet.tags = [addedTag];
			}
			else {
				this.data.$addToSet = { tags: this.addedTags };
				this.expectedData.review.$addToSet.tags = [...this.addedTags];
			}
			this.expectedData.review.$addToSet.tags.sort();
			callback();
		});
	}

	// get the tags we want to add to the review
	getAddedTags () {
		return ['_red'];
	}

	// validate the response to the test request
	validateResponse (data) {
		data.review.$addToSet.tags.sort();
		super.validateResponse(data);
	}
}

module.exports = AddTagTest;
