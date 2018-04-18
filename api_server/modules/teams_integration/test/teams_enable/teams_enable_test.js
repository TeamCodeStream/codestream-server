'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CommonInit = require('./common_init');

class TeamsEnableTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should enable MS Teams integration when requested';
	}

	get method () {
		return 'put';
	}

	// no authentication for the test request
	dontWantToken() {
		return true;
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.deepEqual(data, {}, 'response should have been empty JSON');
	}
}

module.exports = TeamsEnableTest;
