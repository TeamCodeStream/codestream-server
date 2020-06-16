'use strict';

const UpdateTagTest = require('./update_tag_test');

class NoPartialUpdateTest extends UpdateTagTest {

	get description () {
		return `when updating a tag, if ${this.parameter} is not provided, it is deleted - a partial update is not supported`;
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a tag, but...
		super.before(error => {
			if (error) { return callback(error); }
			// delete the label ... this should actually delete the label
			delete this.data[this.parameter];
			delete this.expectedResponse.team.$set[`tags.${this.tagId}`][this.parameter];
			delete this.expectedTags[this.tagId][this.parameter];
			callback();
		});
	}
}

module.exports = NoPartialUpdateTest;
