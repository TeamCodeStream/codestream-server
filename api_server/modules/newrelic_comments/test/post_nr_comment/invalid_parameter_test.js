'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');

class InvalidParameterTest extends CreateNRCommentTest {

	get description () {
		return `should return an error when trying to create a New Relic comment with an invalid ${this.parameter}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: this.parameter
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			if (this.shouldBeNumber) {
				this.data[this.parameter] = 'string bad!';
			} else {
				this.data[this.parameter] = Math.floor(Math.random() * 100000000);
			}
			callback();
		});
	}
}

module.exports = InvalidParameterTest;
