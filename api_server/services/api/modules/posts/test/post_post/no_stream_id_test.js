'use strict';

var PostPostTest = require('./post_post_test');

class NoStreamIdTest extends PostPostTest {

	get description () {
		return 'should return error when attempting to create a post with no stream id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'streamId'
		};
	}

	// before the test runs...
	before (callback) {
		// delete the streamId attribute when we try to create the post
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = NoStreamIdTest;
