'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');

class ConfirmEmailTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should change the user\'s email when requested with a proper token, assuming the new email has been confirmed';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		this.testBegins = Date.now();
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		Assert.equal(data, '/web/confirm-email-complete', 'improper redirect');
	}
}

module.exports = ConfirmEmailTest;
