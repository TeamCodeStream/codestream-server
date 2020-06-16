// base class for many tests of the "PUT /posts" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const PostTestConstants = require('../post_test_constants');

class DeletePostTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated post when deleting a post';
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
		const post = data.posts[0];
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(post.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was deleted');
		this.expectedData.posts[0].$set.modifiedAt = post.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the post in the response has no attributes that should not go to clients
		this.validateSanitized(post.$set, PostTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeletePostTest;
