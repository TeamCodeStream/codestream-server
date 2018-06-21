'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class PreContextMustBeStringTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the preContext is not a string';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'invalid preContext'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// use "numeric" for the pre-context code ... not allowed!
		super.makePostData(() => {
			this.data.codeBlocks[0].preContext = 1;
			callback();
		});
	}
}

module.exports = PreContextMustBeStringTest;
