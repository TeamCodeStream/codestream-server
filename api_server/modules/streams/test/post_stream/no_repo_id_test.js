'use strict';

const PostFileStreamTest = require('./post_file_stream_test');

class NoRepoIdTest extends PostFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a file stream with no repoId';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: {
				code: 'STRM-1002'
			}
		};
	}

	// before the test runs...
	before (callback) {
		// run the standard test set up for posting a file-type stream, but...
		super.before(error => {
			if (error) { return callback(error); }
			// ... delete the repo ID
			delete this.data.repoId;
			callback();
		});
	}
}

module.exports = NoRepoIdTest;
