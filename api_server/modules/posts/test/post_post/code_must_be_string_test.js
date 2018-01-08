'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class CodeMustBeStringTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the code is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: code must be a string'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use "numeric" for the actual code text ... not allowed!
		super.makePostData(() => {
			this.data.codeBlocks[0].code = 1;
			callback();
		});
	}
}

module.exports = CodeMustBeStringTest;
