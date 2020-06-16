'use strict';

const UpdateTagTest = require('./update_tag_test');

class ParameterRequiredTest extends UpdateTagTest {

	get description () {
		return `should return an error when attempting to update a team tag with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
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

module.exports = ParameterRequiredTest;
