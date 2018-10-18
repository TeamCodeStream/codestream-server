'use strict';

const FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');

class NoTeamIdTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no teamId';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1011'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the teamId to use when creating the stream on the fly while we create the post
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.teamId;
			callback();
		});
	}
}

module.exports = NoTeamIdTest;
