'use strict';

var PostCodeToFileStreamTest = require('./post_code_to_file_stream_test');

class NoCommitHashTest extends PostCodeToFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a post with a code block but not providing a commit hash';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'RAPI-1002',
				info: 'commitHashWhenPosted'
			}]
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

module.exports = NoCommitHashTest;
