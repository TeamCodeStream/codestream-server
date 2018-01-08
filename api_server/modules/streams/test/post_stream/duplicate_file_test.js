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

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.repoId = this.duplicateStream.repoId;
			this.data.file = this.duplicateStream.file;
			callback();
		});
	}

	validateResponse (data) {
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileTest;
