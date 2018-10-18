'use strict';

const CodeBlockTest = require('./code_block_test');

class InvalidFileTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element with a file that is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid file'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set a file part of the code block that is numeric instead of the required string
		super.makePostData(() => {
			this.data.codeBlocks[0].file = 1;
			callback();
		});
	}
}

module.exports = InvalidFileTest;
