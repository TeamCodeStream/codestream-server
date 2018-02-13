'use strict';

var PostFileStreamTest = require('./post_file_stream_test');
var Assert = require('assert');

class DuplicateFileTest extends PostFileStreamTest {

	constructor (options) {
		super(options);
		this.testOptions.wantDuplicateStream = true;
	}

	get description () {
		return 'should return the existing stream when creating a file stream with matching repoId and file';
	}

	// before the test runs...
	before (callback) {
		// run the standard test setup for creating a file-type stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and give our test stream the same file-related attributes, this should cause the server
			// to find the existing file-type stream, and return that in the response
			this.data.repoId = this.duplicateStream.repoId;
			this.data.file = this.duplicateStream.file;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// validate that we got back the stream that we already created
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileTest;
