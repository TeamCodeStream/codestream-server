// base class for many tests of the "DELETE /provider-host" requests

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const TeamTestConstants = require(process.env.CS_API_TOP + '/modules/teams/test/team_test_constants');

class DeleteProviderHostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return proper directive to update a team when a provider host is removed';
	}

	get method () {
		return 'delete';
	}

	// before the test runs...
	before (callback) {
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(data.team.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the team was updated');
		this.expectedData.team.$set.modifiedAt = data.team.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the team in the response has no attributes that should not go to clients
		this.validateSanitized(data.team.$set, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteProviderHostTest;
