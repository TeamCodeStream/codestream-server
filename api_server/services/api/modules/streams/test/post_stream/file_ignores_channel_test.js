'use strict';

var PostFileStreamTest = require('./post_file_stream_test');
var Assert = require('assert');

class FileIgnoresChannelTest extends PostFileStreamTest {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a file stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.streamFactory.randomName();
			this.data.memberIds = this.users.splice(1, 3).map(user => user._id);
			callback();
		});
	}

	validateResponse (data) {
		let stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		Assert(typeof stream.memberIds === 'undefined', 'memberIds should be undefined');
		super.validateResponse(data);
	}
}

module.exports = FileIgnoresChannelTest;
