'use strict';

var ChannelOnTheFlyTest = require('./channel_on_the_fly_test');

class MeChannelTest extends ChannelOnTheFlyTest {

	get description () {
		return 'should return a valid post and stream with the user as the only member when creating a post and creating a channel stream on the fly with no member ids specified';
	}

	// before the test runs...
	before (callback) {
		// delete the memberIds attribute from the stream we will try to create on the fly
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.memberIds;
			callback();
		});
	}

	// validate the response to the test request
	validateResponse (data) {
		this.data.stream.memberIds = []; // current user will be pushed in super.validateResponse
		super.validateResponse(data);
	}
}

module.exports = MeChannelTest;
