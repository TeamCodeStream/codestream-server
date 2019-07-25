'use strict';

const CreateTagTest = require('./create_tag_test');

class ParameterOptionalTest extends CreateTagTest {

	get description () {
		return `should be ok to create a team tag with no ${this.parameter}`;
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for creating a tag, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ...delete the parameter of interest
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterOptionalTest;
