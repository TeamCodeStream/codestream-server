'use strict';

const PutReviewTest = require('./put_review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class RemoveTagTest extends PutReviewTest {

	constructor (options) {
		super(options);
		this.wantCustomTags = true;
	}

	get description () {
		return 'should return the updated review and directive when removing a tag from a review';
	}

	// form the data for the review update
	makeReviewUpdateData (callback) {
		this.expectedVersion++;
		BoundAsync.series(this, [
			super.makeReviewUpdateData,
			this.addTags,
			this.setTagsToRemove
		], callback);
	}

	addTags (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: {
					$addToSet: {
						tags: ['_yellow', this.tagIds[1], '_red', this.tagIds[0]]
					}
				},
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.review.tags = response.review.$addToSet.tags;
				callback();
			}
		);
	}

	setTagsToRemove (callback) {
		// find one of the other tags in the review, and remove them 
		this.removedTags = this.getRemovedTags();
		this.expectedData.review.$pull = this.expectedData.review.$pull || {};
		if (this.removedTags.length === 1) {
			// this tests conversion of single element to an array
			const removedTag = this.removedTags[0];
			this.data.$pull = { tags: removedTag };
			this.expectedData.review.$pull.tags = [removedTag];
		}
		else {
			this.data.$pull = { tags: this.removedTags };
			this.expectedData.review.$pull.tags = [...this.removedTags];
		}
		callback();
	}

	// get the tags we want to add to the review
	getRemovedTags () {
		return ['_red'];
	}
}

module.exports = RemoveTagTest;
