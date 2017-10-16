'use strict';

var File_Stream_On_The_Fly_Test = require('./file_stream_on_the_fly_test');
var Assert = require('assert');
var Bound_Async = require(process.env.CI_API_TOP + '/lib/util/bound_async');

class Duplicate_File_Stream_Test extends File_Stream_On_The_Fly_Test {

	get description () {
		return 'should find and use the existing stream when creating a post and creating a file stream on the fly with matching path';
	}

	before (callback) {
		Bound_Async.series(this, [
			super.before,
			this.create_duplicate_stream
		], callback);
	}

	create_duplicate_stream (callback) {
		this.stream_factory.create_random_stream(
			(error, response) => {
				if (error) { return callback(error); }
				this.duplicate_stream = response.stream;
				callback();
			},
			Object.assign({}, this.stream_options, {
				file: this.data.stream.file,
				token: this.token
			})
		);
	}

	validate_response (data) {
		Assert(data.stream._id === this.duplicate_stream._id, 'returned stream should be the same as the existing stream');
		super.validate_response(data);
	}
}

module.exports = Duplicate_File_Stream_Test;
