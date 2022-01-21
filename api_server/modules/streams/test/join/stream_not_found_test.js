'use strict';

const JoinTest = require('./join_test');
const ObjectId = require('mongodb').ObjectId;

class StreamNotFoundTest extends JoinTest {

	get description () {
		return 'should return an error when trying to join a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003',
			info: 'stream'
		};
	}

	// before the test runs...
	before (callback) {
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/join/' + ObjectId(); // substitute an ID for a non-existent stream
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
