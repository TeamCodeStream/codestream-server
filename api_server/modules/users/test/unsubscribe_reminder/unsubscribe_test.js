'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class UnsubscribeTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedVersion = 3;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to unsubscribe success page when unsubscribing from reminder emails from an email link';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.strictEqual(data, '/web/unsubscribe-reminder-complete', 'improper redirect');
	}
}

module.exports = UnsubscribeTest;
