'use strict';

const PostCodemarkTest = require('./post_codemark_test');

class RequiredForTypeTest extends PostCodemarkTest {

	get description () {
		return `should return an error when attempting to create a ${this.codemarkType} codemark without ${this.attribute}`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: `${this.codemarkType} codemarks require ${this.attribute}`
		};
	}

	makeCodemarkData (callback) {
		super.makeCodemarkData(() => {
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = RequiredForTypeTest;
