'use strict';

const CodeBlockTest = require('./code_block_test');

class CodeBlockNotObjectTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element that is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: element at [0-9]+ is not an object'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a "numeric" code-block ... not allowed!
		super.makePostData(() => {
			this.data.codeBlocks.push(1);
			callback();
		});
	}
}

module.exports = CodeBlockNotObjectTest;
