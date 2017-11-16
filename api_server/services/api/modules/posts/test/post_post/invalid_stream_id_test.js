'use strict';

var PostPostTest = require('./post_post_test');
var ObjectID = require('mongodb').ObjectID;

class InvalidStreamIdTest extends PostPostTest {

	get description () {
		return 'should return error when attempting to create a post with an invalid stream id';
	}

	getExpectedFields () {
		return null;
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.data.streamId = ObjectID();
			callback();
		});
	}
}

module.exports = InvalidStreamIdTest;
