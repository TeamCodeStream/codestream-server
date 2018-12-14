'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');

class ProviderDeauthTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return `should clear the access token and associated data for the user when deauthorizing against ${this.provider}`;
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert(data.user.$set.modifiedAt > this.requestSentAfter, 'modifiedAt not set');
		this.expectedResponse.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedResponse, 'response not correct');
	}
}

module.exports = ProviderDeauthTest;
