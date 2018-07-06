'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class TooManyRemotesTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block element where the remotes array has too many elements';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'too many remotes'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// set the "remotes" field to an array of 101 elements
		super.makePostData(() => {
			this.data.codeBlocks[0].remotes = new Array(101).fill('x');
			callback();
		});
	}
}

module.exports = TooManyRemotesTest;
