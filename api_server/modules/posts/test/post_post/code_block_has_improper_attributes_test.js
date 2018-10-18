'use strict';

const CodeBlockTest = require('./code_block_test');

class CodeBlockHasImproperAttributesTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where an improper attribute is provided';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid someAttribute'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a code block and add some invalid attribute to it
		super.makePostData(() => {
			this.data.codeBlocks[0].someAttribute = 1;
			callback();
		});
	}
}

module.exports = CodeBlockHasImproperAttributesTest;
