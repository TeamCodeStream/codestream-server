'use strict';

const CodemarkTest = require('./codemark_test');

class MarkerRequiredForCodemarkTest extends CodemarkTest {

	get description () {
		return `should return an error when attempting to create a post with a(n) ${this.codemarkType} codemark without markers`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require markers`
		};
	}
}

module.exports = MarkerRequiredForCodemarkTest;
