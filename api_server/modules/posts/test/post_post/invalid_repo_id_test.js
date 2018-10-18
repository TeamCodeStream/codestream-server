'use strict';

const FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');
const ObjectID = require('mongodb').ObjectID;

class InvalidRepoIdTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with an invalid repo id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	// before the test runs...
	before (callback) {
		// for the stream we want to create on-the-fly, substitute an ID for a non-existent repo
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.repoId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidRepoIdTest;
