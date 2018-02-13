'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');

class MeDirectTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid direct stream with the user as the only member when creating a direct stream with no member ids specified';
	}

	// before the test runs...
	before (callback) {
		// set up standard test conditions for creating a direct stream...
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

module.exports = MeDirectTest;
