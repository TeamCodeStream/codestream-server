'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');
var Assert = require('assert');

class Duplicate_File_Test extends Post_File_Stream_Test {

	constructor (options) {
		super(options);
		this.test_options.want_duplicate_stream = true;
	}

	get description () {
		return 'should return the existing stream when creating a file stream with matching repo_id and file';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.repo_id = this.duplicate_stream.repo_id;
			this.data.file = this.duplicate_stream.file;
			callback();
		});
	}

	validate_response (data) {
		Assert(data.stream._id === this.duplicate_stream._id, 'returned stream should be the same as the existing stream');
		super.validate_response(data);
	}
}

module.exports = Duplicate_File_Test;
