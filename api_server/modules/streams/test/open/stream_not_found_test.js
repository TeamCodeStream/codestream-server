'use strict';

const OpenTest = require('./open_test');
const ObjectID = require('mongodb').ObjectID;

class StreamNotFoundTest extends OpenTest {

	constructor (options) {
		super(options);
		this.dontCloseFirst = true;
	}
	
	get description () {
		return 'should return an error when trying to open a stream that doesn\'t exist';
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
			this.path = '/open/' + ObjectID(); // substitute an ID for a non-existent stream
			callback();
		});
	}
}

module.exports = StreamNotFoundTest;
