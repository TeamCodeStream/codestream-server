'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');

class NoRepoIdTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no repoId';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1002'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.repoId;
			callback();
		});
	}
}

module.exports = NoRepoIdTest;
