'use strict';

const UpdateTagTest = require('./update_tag_test');

class ParameterOptionalTest extends UpdateTagTest {

	get description () {
		return `should be ok to update a team tag with no ${this.parameter}`;
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a tag, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...delete the parameter of interest
			delete this.data[this.parameter];
			delete this.expectedResponse.team.$set[`tags.${this.tagId}`][this.parameter];
			callback();
		});
	}
}

module.exports = ParameterOptionalTest;
