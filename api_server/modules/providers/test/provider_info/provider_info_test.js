'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');

class ProviderInfoTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		let description = 'should return a directive appropriate to update provider info when a user sets a third-party provider info';
		if (this.testHost) {
			description += ', enterprise version';
		}
		return description;
	}

	get method () {
		return 'put';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			CodeStreamAPITest.prototype.before.bind(this),
			this.init
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.user.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the user was updated');
		this.expectedData.user.$set.modifiedAt = data.user.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(data.user.$set, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = ProviderInfoTest;
