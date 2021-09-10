// base class for many tests of the "PUT /companies/join/:id" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const UserTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/test/user_test_constants');

class JoinCompanyTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated user plus company and team when joining a company';
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
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.user.$set.modifiedAt >= this.modifiedAfter, 'user.modifiedAt is not greater than before the join was performed');
		this.expectedResponse.user.$set.modifiedAt = data.user.$set.modifiedAt;
		Assert(data.team.modifiedAt >= this.modifiedAfter, 'team.modifiedAt is not greater than before the join was performed');
		this.expectedResponse.team.modifiedAt = data.team.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedResponse, 'response data is not correct');
		// verify the user in the response has no attributes that should not go to clients
		this.validateSanitized(data.user.$set, UserTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = JoinCompanyTest;
