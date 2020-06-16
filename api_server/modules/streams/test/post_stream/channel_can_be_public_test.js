'use strict';

const PostChannelStreamTest = require('./post_channel_stream_test');
const Assert = require('assert');

class ChannelCanBePublicTest extends PostChannelStreamTest {

	get description () {
		return 'should return a valid stream and allow it to be public when public attribute is set';
	}

	// before the test runs...
	before (callback) {
		// run standard setup for creating a team stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ...and add a "public" privacy setting
			this.data.privacy = 'public';
			callback();
		});
	}

	// validate the response to the test request
	validaconstteResponse (data) {
		// verify the privacy is public
		let stream = data.stream;
		Assert(stream.privacy === 'public', 'privacy is not public');
		super.validateResponse(data);
	}
}

module.exports = ChannelCanBePublicTest;
