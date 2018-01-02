'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');

class NoFileTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should return an error when attempting to create a post and creating a file stream on the fly with no file';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1005',
			info: [{
				code: 'STRM-1003'
			}]
		};
	}

	// before the test runs...
	before (callback) {
		// delete the file attribute from the stream we are trying to create on the fly
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.file;
			callback();
		});
	}
}

module.exports = NoFileTest;
