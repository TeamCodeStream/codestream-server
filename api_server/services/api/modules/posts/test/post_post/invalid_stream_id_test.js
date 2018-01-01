'use strict';

var PostPostTest = require('./post_post_test');
var ObjectID = require('mongodb').ObjectID;

class InvalidStreamIdTest extends PostPostTest {

	get description () {
		return 'should return error when attempting to create a post with an invalid stream id';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// before the test runs...
	before (callback) {
		// substitute an ID for a non-existent stream when trying to create the post
		super.before(error => {
			if (error) { return callback(error); }
			this.data.streamId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidStreamIdTest;
