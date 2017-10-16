'use strict';

var File_Stream_On_The_Fly_Test = require('./file_stream_on_the_fly_test');

class No_File_Test extends File_Stream_On_The_Fly_Test {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no file';
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
			delete this.data.stream.file;
			callback();
		});
	}
}

module.exports = No_File_Test;
