'use strict';

const AddTagsTest = require('./add_tags_test');
const ObjectId = require('mongodb').ObjectId;

class TagsNotFoundTest extends AddTagsTest {

	get description () {
		return 'should return an error when trying to add tags to a review when one or more of the tags aren\'t known tags for the team';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		// substitute bogus tags value
		super.makeReviewUpdateData(() => {
			this.data.$addToSet.tags.push(ObjectId());
			callback();
		});
	}
}

module.exports = TagsNotFoundTest;
