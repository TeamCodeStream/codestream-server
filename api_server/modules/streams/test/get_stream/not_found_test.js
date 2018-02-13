'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
var ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch a stream that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// set path to look for some random stream ID, instead of the one we created
		this.path = '/streams/' + ObjectID();
		callback();
	}
}

module.exports = NotFoundTest;
