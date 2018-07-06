'use strict';

var CodeBlockFromDifferentStreamTest = require('./code_block_from_different_stream_test');

class NoCommitHashWithStreamTest extends CodeBlockFromDifferentStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block but not providing a commit hash, when a stream is also specified';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: 'commitHash must be provided for codeBlocks attached to a stream'
		};
	}

	// form the data to use in trying to create the post
	makePostData (callback) {
		// remove the commit hash from the data to use in creating the post
		super.makePostData(() => {
			delete this.data.commitHashWhenPosted;
			callback();
		});
	}
}

module.exports = NoCommitHashWithStreamTest;
