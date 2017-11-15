'use strict';

var PostDirectStreamTest = require('./post_direct_stream_test');

class MeDirectTest extends PostDirectStreamTest {

	get description () {
		return 'should return a valid direct stream with the user as the only member when creating a direct stream with no member ids specified';
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

module.exports = MeDirectTest;
