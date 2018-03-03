'use strict';

var SlackEnableTest = require('./slack_enable_test');

class MissingParameterTest extends SlackEnableTest {

	get description () {
		return `should return an error when trying to send a slack enable request without providing the ${this.parameter} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		// call standard setup, but then delete the test parameter
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter]; 
			callback();
		});
	}
}

module.exports = MissingParameterTest;
