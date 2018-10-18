'use strict';

const CodeBlockTest = require('./code_block_test');

class RemotesMustBeArrayOfStringsTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the remotes is not an array of strings';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid remotes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "remotes" field to an array with mixed elements
		super.makePostData(() => {
			this.data.codeBlocks[0].remotes = [1, 'hello', 2];
			callback();
		});
	}
}

module.exports = RemotesMustBeArrayOfStringsTest;
