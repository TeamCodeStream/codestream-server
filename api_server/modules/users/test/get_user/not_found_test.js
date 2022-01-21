'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const ObjectId = require('mongodb').ObjectId;

class NotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch a user that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1009'
		};
	}

	// before the test runs...
	before (callback) {
		// we'll try to fetch a non-existent user, with a random ID
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/users/' + ObjectId();
			callback();
		});
	}
}

module.exports = NotFoundTest;
