'use strict';

var PostFileStreamTest = require('./post_file_stream_test');

class NoFileTest extends PostFileStreamTest {

	get description () {
		return 'should return an error when attempting to create a file stream with no file';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
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

module.exports = NoFileTest;
