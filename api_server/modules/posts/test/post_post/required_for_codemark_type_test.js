'use strict';

const CodemarkTest = require('./codemark_test');

class RequiredForCodemarkTypeTest extends CodemarkTest {

	get description () {
		return `should return an error when attempting to create a post with a(n) ${this.codemarkType} codemark without ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require ${this.attribute}`
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			delete this.data.codemark[this.attribute];
			callback();
		});
	}
}

module.exports = RequiredForCodemarkTypeTest;
