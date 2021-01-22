'use strict';

const GitLensUserTest = require('./gitlens_user_test');

class ParameterTooLongTest extends GitLensUserTest {

	get description () {
		return `should return an error when submitting a request to create a GitLens user with a ${this.parameter} that is too long`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			reason: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// generate a longer string for the data to submit with the request
		super.before(error => {
			if (error) { return callback(error); }
			this.data[this.parameter] = 'x'.repeat(201);
			callback();
		});
	}
}

module.exports = ParameterTooLongTest;
