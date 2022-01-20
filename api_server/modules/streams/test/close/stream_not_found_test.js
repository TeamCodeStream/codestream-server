'use strict';

const CloseTest = require('./close_test');
const ObjectId = require('mongodb').ObjectId;

class StreamNotFoundTest extends CloseTest {

	get description () {
		return 'should return an error when trying to close a stream that doesn\'t exist';
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
			this.path = '/streams/close/' + ObjectId(); // substitute an ID for a non-existent stream
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
