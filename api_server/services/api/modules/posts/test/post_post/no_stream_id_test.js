'use strict';

var PostPostTest = require('./post_post_test');

class NoStreamIdTest extends PostPostTest {

	get description () {
		return 'should return error when attempting to create a post with no stream id';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1001',
			info: 'streamId'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			delete this.data.streamId;
			callback();
		});
	}
}

module.exports = NoStreamIdTest;
