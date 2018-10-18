'use strict';

const CodeBlockTest = require('./code_block_test');

class RemotesMustBeArrayTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the remotes is not an array';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid remotes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "remotes" field to a numeric
		super.makePostData(() => {
			this.data.codeBlocks[0].remotes = 1;
			callback();
		});
	}
}

module.exports = RemotesMustBeArrayTest;
