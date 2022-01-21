'use strict';

const GetStreamTest = require('./get_stream_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends GetStreamTest {

	get description () {
		return 'should return an error when trying to fetch a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	setPath (callback) {
		this.path = '/streams/' + ObjectId();
		callback();
	}
}

module.exports = NotFoundTest;
