'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class MeChannelTest extends PostChannelStreamTest {

	get description () {
		return 'should return a valid channel stream with the user as the only member when creating a channel stream with no member ids specified';
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a channel stream...
		super.before(error => {
			if (error) { return callback(error); }
			// ... and delete the member IDs, this is allowed but will make the creator of the stream the only member
			delete this.data.memberIds;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		this.data.memberIds = []; // current user will be pushed 
		super.validateResponse(data);
	}
}

module.exports = MeChannelTest;
