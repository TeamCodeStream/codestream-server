'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');

class No_Attribute_Test extends Post_File_Stream_Test {

	get description () {
		return `should return error when attempting to create a stream with no ${this.attribute}`;
	}

	get_expected_fields () {
		return null;
	}

	get_expected_error () {
		return {
			code: 'RAPI-1002',
			info: this.attribute
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data[this.attribute];
			callback();
		});
	}
}

module.exports = No_Attribute_Test;
