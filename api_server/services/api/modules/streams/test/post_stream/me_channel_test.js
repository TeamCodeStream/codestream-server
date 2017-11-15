'use strict';

var PostChannelStreamTest = require('./post_channel_stream_test');

class MeChannelTest extends PostChannelStreamTest {

	get description () {
		return 'should return a valid channel stream with the user as the only member when creating a channel stream with no member ids specified';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.memberIds;
			callback();
		});
	}

	validateResponse (data) {
		this.data.memberIds = []; // current user will be pushed
		super.validateResponse(data);
	}
}

module.exports = MeChannelTest;
