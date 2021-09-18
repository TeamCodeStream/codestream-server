// base class for many tests of the "DELETE /code-errors/:id" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');
const CodeErrorTestConstants = require('../code_error_test_constants');
const PostTestConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/posts/test/post_test_constants');

class DeleteCodeErrorTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the deactivated code error and associated post when deleting a code error';
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
		const codeError = data.codeErrors[0];
		const post = data.posts[0];
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(codeError.$set.modifiedAt >= this.modifiedAfter, 'modifiedAt for the code error is not greater than before the code error was deleted');
		Assert(post.$set.modifiedAt >= this.modifiedAfter, 'code error modifiedAt is not greater than before the post was deleted');
		this.expectedData.codeErrors[0].$set.modifiedAt = codeError.$set.modifiedAt;
		this.expectedData.posts[0].$set.modifiedAt = post.$set.modifiedAt;
		// verify we got back the proper response
		Assert.deepEqual(data, this.expectedData, 'response data is not correct');
		// verify the post and code error in the response has no attributes that should not go to clients
		this.validateSanitized(post.$set, PostTestConstants.UNSANITIZED_ATTRIBUTES);
		this.validateSanitized(codeError.$set, CodeErrorTestConstants.UNSANITIZED_ATTRIBUTES);
	}
}

module.exports = DeleteCodeErrorTest;
