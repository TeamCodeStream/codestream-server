// base class for many tests of the "PUT /teams" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const TeamTestConstants = require('../team_test_constants');

class PutTeamTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		const unifiedIdentity = this.unifiedIdentityEnabled ? ', under unifiied identity' : '';
		return `should return the updated team when updating a team${unifiedIdentity}`;
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
		Assert(data.team.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the team was updated');
		this.expectedData.team.$set.modifiedAt = data.team.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the team in the response has no attributes that should not go to clients
		this.validateSanitized(data.team.$set, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = PutTeamTest;
