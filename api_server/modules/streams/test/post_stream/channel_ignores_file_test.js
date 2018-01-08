'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');
var Assert = require('assert');

class ChannelIgnoresFileTest extends PostChannelStreamTest {

	get description () {
		return 'should return a valid stream and ignore file-related attributes when creating a channel stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.file = this.streamFactory.randomFile();
			this.data.repoId = this.repo._id;
			callback();
		});
	}

	validateResponse (data) {
		let stream = data.stream;
		Assert(typeof stream.file === 'undefined', 'file should be undefined');
		Assert(typeof stream.repoId === 'undefined', 'repoId should be undefined');
		super.validateResponse(data);
	}
}

module.exports = ChannelIgnoresFileTest;
