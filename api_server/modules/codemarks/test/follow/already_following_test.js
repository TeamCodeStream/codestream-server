'use strict';

const FollowTest = require('./follow_test');
const Assert = require('assert');

class AlreadyFollowingTest extends FollowTest {

	get description () {
		return 'should return empty response if user follows a codemark they are already following';
	}

	run (callback) {
		super.run(error => {
			if (error) { return callback(error); }
			this.secondRun = true;
			callback();
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

module.exports = AlreadyFollowingTest;
