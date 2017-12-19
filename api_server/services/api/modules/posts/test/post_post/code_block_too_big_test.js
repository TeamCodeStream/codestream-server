'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class CodeBlockTooBigTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element that is too big';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'codeBlocks: object at [0-9]+ is too long'
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeBlocks[0].code = 'x'.repeat(10001);
			callback();
		});
	}
}

module.exports = CodeBlockTooBigTest;
