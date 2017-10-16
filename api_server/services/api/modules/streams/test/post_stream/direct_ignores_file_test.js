'use strict';

var Post_Direct_Stream_Test = require('./post_direct_stream_test');
var Assert = require('assert');

class Direct_Ignores_File_Test extends Post_Direct_Stream_Test {

	get description () {
		return 'should return a valid stream and ignore file-related attributes when creating a direct stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.file = this.stream_factory.random_file();
			this.data.repo_id = this.repo._id;
			callback();
		});
	}

	validate_response (data) {
		let stream = data.stream;
		Assert(typeof stream.file === 'undefined', 'file should be undefined');
		Assert(typeof stream.repo_id === 'undefined', 'repo_id should be undefined');
		super.validate_response(data);
	}
}

module.exports = Direct_Ignores_File_Test;
