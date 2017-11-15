'use strict';

var FileStreamOnTheFlyTest = require('./file_stream_on_the_fly_test');
var Assert = require('assert');
var BoundAsync = require(process.env.CS_API_TOP + '/lib/util/bound_async');

class DuplicateFileStreamTest extends FileStreamOnTheFlyTest {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a file stream on the fly with matching path';
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createDuplicateStream
		], callback);
	}

	createDuplicateStream (callback) {
		this.streamFactory.createRandomStream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicateStream = response.stream;
				callback();
			},
			Object.assign({}, this.streamOptions, {
				file: this.data.stream.file,
				token: this.token
			})
		);
	}

	validateResponse (data) {
		Assert(data.stream._id === this.duplicateStream._id, 'returned stream should be the same as the existing stream');
		super.validateResponse(data);
	}
}

module.exports = DuplicateFileStreamTest;
