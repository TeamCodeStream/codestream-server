'use strict';

const CodemarkTest = require('./codemark_test');

class CodemarkAttributeRequiredTest extends CodemarkTest {

	get description () {
		return `should return an error when attempting to create a codemark with no ${this.attribute} parameter`;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: this.attribute
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the codemark attribute
		super.makePostData(() => {
			delete this.data.codemark[this.attribute];
			callback();
		});
	}
}

module.exports = CodemarkAttributeRequiredTest;
