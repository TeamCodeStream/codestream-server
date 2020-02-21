'use strict';

const AddTagTest = require('./add_tag_test');
const Assert = require('assert');

class AddPreviouslyAddedTagTest extends AddTagTest {

	get description () {
		return 'should be ok to add a tag to a review when the review already has that tag';
	}

	init (callback) {
		// add the tag ahead of time, test should still pass
		super.init(error => {
			if (error) { return callback(error); }
			this.addTag(callback);
		});
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// the response will be empty, since there is no change
		Assert.deepEqual(data, { }, 'expected empty response');
	}
}

module.exports = AddPreviouslyAddedTagTest;
