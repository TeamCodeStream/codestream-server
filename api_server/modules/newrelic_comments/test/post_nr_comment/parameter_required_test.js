'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class ParameterRequiredTest extends CreateNRCommentTest {

	get description () {
		return `should return an error when trying to create a New Relic comment with no ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.parameter];
			callback();
		});
	}
}

module.exports = ParameterRequiredTest;
