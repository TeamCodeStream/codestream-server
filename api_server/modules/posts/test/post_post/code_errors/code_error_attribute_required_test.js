'use strict';

const CodeErrorTest = require('./code_error_test');

class CodeErrorAttributeRequiredTest extends CodeErrorTest {

	get description () {
		return `should return an error when attempting to create a code error with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the code error attribute
		super.makePostData(() => {
			delete this.data.codeError[this.attribute];
			callback();
		});
	}
}

module.exports = CodeErrorAttributeRequiredTest;
