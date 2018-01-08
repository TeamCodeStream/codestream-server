'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');

class NoRepoIdTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no repoId';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1002'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// delete the repoId to use when creating the stream on the fly while we create the post
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.repoId;
			callback();
		});
	}
}

module.exports = NoRepoIdTest;
