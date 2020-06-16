// base class for all telemetry key tests

'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');

class TelemetryKeyTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
	}

	get description () {
		return 'should send the telemetry key when requested with the proper secret';
	}
	
	get method () {
		return 'get';
	}

	get path () {
		return `/no-auth/telemetry-key?secret=${encodeURIComponent(this.apiConfig.secrets.telemetry)}`;
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data.key, this.apiConfig.segment.token, 'returned token is not correct');
	}
}

module.exports = TelemetryKeyTest;
