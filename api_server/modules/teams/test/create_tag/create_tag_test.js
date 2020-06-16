// provide a base class for most tests of the "POST /team-tags/:id" request

'use strict';

const Aggregation = require(process.env.CS_API_TOP + '/server_utils/aggregation');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const Assert = require('assert');
const CommonInit = require('./common_init');

class CreateTagTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should add a tag and respond with appropriate directive when creating a tag for a team';
	}

	get method () {
		return 'post';
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

module.exports = CreateTagTest;
