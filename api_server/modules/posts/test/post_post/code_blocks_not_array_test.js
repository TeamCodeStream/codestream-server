'use strict';

const CodeBlockTest = require('./code_block_test');

class CodeBlocksNotArrayTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with code blocks attribute that is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: must be an array of objects'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use a "numeric" code block structure ... not allowed!
		super.makePostData(() => {
			this.data.codeBlocks = 1;
			callback();
		});
	}
}

module.exports = CodeBlocksNotArrayTest;
