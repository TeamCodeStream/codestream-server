'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class CodeBlockNotObjectTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element that is not an object';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'RAPI-1005',
				info: 'codeBlocks: element at [0-9]+ is not an object'
			}]
		};
	}

	makePostData (callback) {
		super.makePostData(() => {
			this.data.codeBlocks.push(1);
			callback();
		});
	}
}

module.exports = CodeBlockNotObjectTest;
