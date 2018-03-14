'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class InvalidParameterTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when the value of a directive in a preferences request is not set to the value of an object';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/preferences';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012',
			info: '\\$set'
		};
	}

	// before the test runs...
	before (callback) {
		// the value of $set must be an object
		this.data = {
			$set: 'x'
		};
		callback();
	}
}

module.exports = InvalidParameterTest;
