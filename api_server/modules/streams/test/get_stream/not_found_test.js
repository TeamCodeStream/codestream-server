'use strict';

const GetStreamTest = require('./get_stream_test');
const ObjectID = require('mongodb').ObjectID;

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
		this.path = '/streams/' + ObjectID();
		callback();
	}
}

module.exports = NotFoundTest;
