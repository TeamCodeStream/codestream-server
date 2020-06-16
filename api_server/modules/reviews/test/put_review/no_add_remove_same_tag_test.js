'use strict';

const AddRemoveTagsTest = require('./add_remove_tags_test');

class NoAddRemoveSameTagTest extends AddRemoveTagsTest {

	get description () {
		return 'should return an error when trying to add and remove the same tag for a review';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		super.makeReviewUpdateData(() => {
			this.data.$pull.tags.push(this.data.$addToSet.tags[1]);
			callback();
		});
	}
}

module.exports = NoAddRemoveSameTagTest;
