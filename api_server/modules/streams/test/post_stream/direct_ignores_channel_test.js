'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');
var Assert = require('assert');

class DirectIgnoresChannelTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid stream and ignore channel-related attributes when creating a direct stream';
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a direct stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and add a name, this should be ignored
			this.data.name = this.streamFactory.randomName();
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		// even though we added a name, we should not see these in the response, since we created
		// a direct-type stream
		let stream = data.stream;
		Assert(typeof stream.name === 'undefined', 'name should be undefined');
		super.validateResponse(data);
	}
}

module.exports = DirectIgnoresChannelTest;
