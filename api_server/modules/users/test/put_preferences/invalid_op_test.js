'use strict';

var CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');

class InvalidOpTest extends CodeStreamAPITest {

	get description () {
		return 'should return an error when an invalid update is sent with an update preferences request';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/preferences';
	}

	getExpectedError () {
		return {
			code: 'RAPI-1012'
		};
	}

	before (callback) {
		this.data = {
			$set: { a: 1 },
			$unset: { a: 1 }
		};
		callback();
	}
}

module.exports = InvalidOpTest;
