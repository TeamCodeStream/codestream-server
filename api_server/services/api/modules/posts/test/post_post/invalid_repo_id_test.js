'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');
var ObjectID = require('mongodb').ObjectID;

class InvalidRepoIdTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with an invalid repo id';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'repo'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.stream.repoId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidRepoIdTest;
