// provide basic test class for logout request tests

'use strict';

const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');

class LogoutTest extends CodeStreamAPITest {

	get description () {
		return 'should return an empty response after logging out';
	}

	get method () {
		return 'put';
	}

	get path () {
		return '/logout';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepStrictEqual(data, {}, 'empty response not returned');
	}
}

module.exports = LogoutTest;
