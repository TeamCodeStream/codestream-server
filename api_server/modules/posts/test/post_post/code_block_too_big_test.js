'use strict';

const CodeBlockTest = require('./code_block_test');

class CodeBlockTooBigTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element that is too big';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: object at [0-9]+ is too long'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// put a whole bunch of code in the code block, greater than the limit
		super.makePostData(() => {
			this.data.codeBlocks[0].code = 'x'.repeat(10001);
			callback();
		});
	}
}

module.exports = CodeBlockTooBigTest;
