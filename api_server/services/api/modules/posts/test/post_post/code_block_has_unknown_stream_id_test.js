'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');
var ObjectID = require('mongodb').ObjectID;

class CodeBlockHasUnknownStreamIdTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the stream ID is unknown';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeBlocks[0].streamId = ObjectID();
			callback();
		});
	}
}

module.exports = CodeBlockHasUnknownStreamIdTest;
