'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');
var Assert = require('assert');

class DirectIgnoresChannelTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a direct stream';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.name = this.streamFactory.randomName();
			callback();
		});
	}

	validateResponse (data) {
		let stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		super.validateResponse(data);
	}
}

module.exports = DirectIgnoresChannelTest;
