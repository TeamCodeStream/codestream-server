'use strict';

const CodeBlockTest = require('./code_block_test');

class CodeBlocksTooLongTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code blocks array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: array is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// create an array of code blocks that is over the limit in size
		super.makePostData(() => {
			const moreStuff = 'x,'.repeat(10).split(',');
			this.data.codeBlocks = [...this.data.codeBlocks, ...moreStuff];
			callback();
		});
	}
}

module.exports = CodeBlocksTooLongTest;
