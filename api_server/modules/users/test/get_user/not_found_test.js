'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ObjectID = require('mongodb').ObjectID;

class NotFoundTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when trying to fetch a user that doesn\'t exist';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1003'
		};
	}

	// before the test runs...
	before (callback) {
		// we'll try to fetch a non-existent user, with a random ID
		super.before(error => {
			if (error) { return callback(error); }
			this.path = '/users/' + ObjectID();
			callback();
		});
	}
}

module.exports = NotFoundTest;
