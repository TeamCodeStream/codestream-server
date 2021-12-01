// base class for many tests of the "PUT /code-error/claim/:teamId" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CodeErrorTestConstants = require('../code_error_test_constants');
const PostTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/test/post_test_constants');
const StreamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/streams/test/stream_test_constants');
const TeamTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/test/team_test_constants');
const CodeErrorValidator = require('../code_error_validator');

class ClaimCodeErrorTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the updated code error when updating a code error';
	}

	get method () {
		return 'post';
	}

	// before the test runs...
	before (callback) {
		this.expectedTeamVersion = 4;
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// since the permalink is generated, we need to validate that then we'll copy in
		// so the deep-equal works
		new CodeErrorValidator({ test: this }).validatePermalink(data.codeError.permalink);
		this.expectedData.codeError.permalink = data.codeError.permalink;
		
		// sort before we compare
		data.codeError.followerIds.sort();
		this.expectedData.codeError.followerIds.sort();

		// modifiedAt of team should be updated
		if (!this.dontExpectTeamUpdate) {
			Assert(data.team.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt not set');
			this.expectedData.team.$set.modifiedAt = data.team.$set.modifiedAt;
		}
		
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');

		// verify the code error in the response has no attributes that should not go to clients
		this.validateSanitized(data.codeError, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(data.post, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(data.stream, StreamTestConstants.UNSANITIZED_ATTRIBUTES);
		if (!this.dontExpectTeamUpdate) {
			this.validateSanitized(data.team.$set, TeamTestConstants.UNSANITIZED_ATTRIBUTES);
		}
	}
}

module.exports = ClaimCodeErrorTest;
