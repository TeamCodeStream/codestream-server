'use strict';

const PutReviewTest = require('./put_review_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class AddRemoveTagsTest extends PutReviewTest {

	constructor (options) {
		super(options);
		this.wantCustomTags = true;
	}

	get description () {
		return 'should return the updated review and directive to both add and remove when adding and removing tags to/from a review';
	}

	// form the data for the review update
	makeReviewUpdateData (callback) {
		this.expectedVersion++;
		BoundAsync.series(this, [
			super.makeReviewUpdateData,
			this.addTags,
			this.setTagsToAddAndRemove
		], callback);
	}

	addTags (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/reviews/' + this.review.id,
				data: {
					$addToSet: {
						tags: ['_yellow', this.tagIds[1], '_red']
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

	setTagsToAddAndRemove (callback) {
		this.addedTags = ['_blue', this.tagIds[0]];
		this.data.$addToSet = { tags: this.addedTags };
		this.expectedData.review.$addToSet = { tags: this.addedTags };
		this.removedTags = [this.tagIds[1], '_red'];
		this.data.$pull = { tags: this.removedTags };
		this.expectedData.review.$pull = { tags: this.removedTags };
		callback();
	}
}

module.exports = AddRemoveTagsTest;
