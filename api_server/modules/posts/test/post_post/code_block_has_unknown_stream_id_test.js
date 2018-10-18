'use strict';

const CodeBlockTest = require('./code_block_test');
const ObjectID = require('mongodb').ObjectID;

class CodeBlockHasUnknownStreamIdTest extends CodeBlockTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// we'll add a code block from a non-existent stream 
		super.makePostData(() => {
			this.data.codeBlocks[0].streamId = ObjectID();
			callback();
		});
	}
}

module.exports = CodeBlockHasUnknownStreamIdTest;
