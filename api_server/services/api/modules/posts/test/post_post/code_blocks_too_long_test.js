'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class CodeBlocksTooLongTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code blocks array that is too long';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'RAPI-1005',
				info: 'codeBlocks: array is too long'
			}]
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			let moreStuff = 'x,'.repeat(10).split(',');
			this.data.codeBlocks = [...this.data.codeBlocks, ...moreStuff];
			callback();
		});
	}
}

module.exports = CodeBlocksTooLongTest;
