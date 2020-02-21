'use strict';

const RemoveTagTest = require('./remove_tag_test');
const Assert = require('assert');

class RemovePreviouslyRemovedTagTest extends RemoveTagTest {

	get description () {
		return 'should be ok to remove a tag from a review when the tag has already been removed from that review';
	}

	init (callback) {
		// remove the tag ahead of time, test should still pass
		super.init(error => {
			if (error) { return callback(error); }
			this.removeTag(callback);
		});
	}
	
	// validate the response to the test request
	validateResponse (data) {
		// the response will be empty, since there is no change
		Assert.deepEqual(data, { }, 'expected empty response');
	}
}

module.exports = RemovePreviouslyRemovedTagTest;
