// provide a base class for most tests of the "PUT /team-tags/:teamId/:id" request

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const CommonInit = require('./common_init');

class UpdateTagTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should update a tag and respond with appropriate directive when updating a tag for a team';
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
		Assert(data.team.$set.modifiedAt >= this.updatedAt, 'modifiedAt was not changed');
		this.expectedResponse.team.$set.modifiedAt = data.team.$set.modifiedAt;
		Assert.deepEqual(data, this.expectedResponse);
	}
}

module.exports = UpdateTagTest;
