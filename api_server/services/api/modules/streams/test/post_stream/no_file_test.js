'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');

class No_File_Test extends Post_File_Stream_Test {

	get description () {
		return 'should return an error when attempting to create a file stream with no file';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1003'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.file;
			callback();
		});
	}
}

module.exports = No_File_Test;
