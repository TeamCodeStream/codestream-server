'use strict';

const PutStreamTest = require('./put_stream_test');
const ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends PutStreamTest {

	get description () {
		return 'should return an error when trying to update a stream that doesn\'t exist';
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
			this.path = '/streams/' + ObjectID(); // substitute an ID for a non-existent stream
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
