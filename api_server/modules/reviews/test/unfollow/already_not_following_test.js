'use strict';

const UnfollowTest = require('./unfollow_test');
const Assert = require('assert');

class AlreadyNotFollowingTest extends UnfollowTest {

	get description () {
		return 'should return empty response if user unfollows a review they are already not following';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.secondRun = true;
			super.run(callback);
		});
	}

	validateResponse (data) {
		if (!this.secondRun) {
			super.validateResponse(data);
		}
		else {
			Assert.deepEqual(data, {}, 'response should be empty object');
		}
	}
}

module.exports = AlreadyNotFollowingTest;
