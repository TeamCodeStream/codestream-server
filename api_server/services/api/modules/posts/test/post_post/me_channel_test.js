'use strict';

var ChannelOnTheFlyTest = require('./channel_on_the_fly_test');

class MeChannelTest extends ChannelOnTheFlyTest {

	get description () {
		return 'should return a valid post and stream with the user as the only member when creating a post and creating a channel stream on the fly with no member ids specified';
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.stream.memberIds;
			callback();
		});
	}

	validateResponse (data) {
		this.data.stream.memberIds = []; // current user will be pushed
		super.validateResponse(data);
	}
}

module.exports = MeChannelTest;
