'use strict';

const CodeBlockTest = require('./code_block_test');

class NoCodeTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element with no code';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'missing code'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// delete the code text
		super.makePostData(() => {
			delete this.data.codeBlocks[0].code;
			callback();
		});
	}
}

module.exports = NoCodeTest;
