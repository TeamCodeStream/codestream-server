'use strict';

var Post_File_Stream_Test = require('./post_file_stream_test');
var Assert = require('assert');

class File_Ignores_Channel_Test extends Post_File_Stream_Test {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a file stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.stream_factory.random_name();
			this.data.member_ids = this.users.splice(1, 3).map(user => user._id);
			callback();
		});
	}

	validate_response (data) {
		let stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		Assert(typeof stream.member_ids === 'undefined', 'member_ids should be undefined');
		super.validate_response(data);
	}
}

module.exports = File_Ignores_Channel_Test;
