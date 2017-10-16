'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');

class Invalid_Type_Test extends Post_File_Stream_Test {

	get description () {
		return 'should return an error when attempting to create a stream of an invalid type';
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1000'
			}]
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.type = 'sometype';
			callback();
		});
	}
}

module.exports = Invalid_Type_Test;
