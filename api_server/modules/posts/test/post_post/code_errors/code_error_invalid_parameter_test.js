'use strict';

const CodeErrorTest = require('./code_error_test');

class CodeErrorAttributeRequiredTest extends CodeErrorTest {

	get description () {
		return `should return an error when attempting to create a code error with an invalid ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the code error attribute
		super.makePostData(() => {
			if (this.shouldBeNumber) {
				this.data.codeError[this.attribute] = "string bad!";
			} else {
				this.data.codeError[this.attribute] = Math.floor(Math.random() * 10000000);
			}
			callback();
		});
	}
}

module.exports = CodeErrorAttributeRequiredTest;
