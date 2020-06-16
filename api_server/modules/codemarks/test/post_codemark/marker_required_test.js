'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class MarkerRequiredTest extends PostCodemarkTest {

	get description () {
		return `should return an error when attempting to create a ${this.codemarkType} codemark without markers`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require markers`
		};
	}
}

module.exports = MarkerRequiredTest;
