'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class UnfollowTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	constructor (options) {
		super(options);
		this.expectedVersion = 3;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return 'should redirect to unfollow success page when unfollowing a review from an email link';
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
		Assert.equal(data, '/web/unfollow-complete', 'improper redirect');
	}
}

module.exports = UnfollowTest;
