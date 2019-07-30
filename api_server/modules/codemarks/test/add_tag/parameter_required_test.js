'use strict';

const AddTagTest = require('./add_tag_test');

class ParameterRequiredTest extends AddTagTest {

	get description () {
		return `should return an error when attempting to add a tag to a codemark with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// delete the parameter when we try to create the codemark 
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
