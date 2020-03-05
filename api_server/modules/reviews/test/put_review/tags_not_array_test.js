'use strict';

const AddTagTest = require('./add_tag_test');

class TagsNotArrayTest extends AddTagTest {

	get description () {
		return 'should return an error when trying to update a review with a tags attribute that is not a string or array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005'
		};
	}

	// before the test runs...
	makeReviewUpdateData (callback) {
		// substitute bogus tags value
		super.makeReviewUpdateData(() => {
			this.data.$addToSet.tags = 1;
			callback();
		});
	}
}

module.exports = TagsNotArrayTest;
