'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');

class DuplicateFileStreamTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a file stream on the fly with matching path';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream	// pre-create a file stream with the same path as we'll use in the test
		], callback);
	}

	// create a file stream which will look like a duplicate when we run the test
	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			// use the path of the pre-created file stream when we try to run the test
			Object.assign({}, this.streamOptions, {
				file: this.data.stream.file,
				token: this.token
			})
		);
	}

	// validate the response to the post request
	validateResponse (data) {
		// validate that we get back the stream that was already created, instead of a new stream
		Assert(data.streams[0]._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileStreamTest;
