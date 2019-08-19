'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const APICapabilities = require(process.env.CS_API_TOP + '/etc/capabilities');
const Assert = require('assert');

class CapabilitiesTest extends CodeStreamAPITest {

	get description () {
		return 'should return API server capabilities when requested';
	}

	get method () {
		return 'get';
	}

	get path () {
		return '/no-auth/capabilities';
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, { capabilities: APICapabilities }, 'returned capabilities are not correct');
	}
}

module.exports = CapabilitiesTest;
