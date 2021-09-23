// base class for many tests of the "POST /nr-comments" requests

'use strict';

const Aggregation = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/aggregation');
const Assert = require('assert');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const CommonInit = require('./common_init');

class CreateNRCommentTest extends Aggregation(CodeStreamAPITest, CommonInit) {

	get description () {
		return 'should return the expected response when a request is made to create a New Relic comment';
	}

	get method () {
		return 'post';
	}

	// before the test runs...
	before (callback) {
		this.path = '/nr-comments';
		this.init(callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// verify id, createdAt, and modifiedAt were created, and then set it so the deepEqual works
		const post = data.post;
		Assert(post.id, 'returned post has no ID');
		this.expectedResponse.post.id = post.id;
		Assert(post.parentPostId, 'returned post has no parentPostId');
		this.expectedResponse.post.parentPostId = post.parentPostId;
		Assert(post.createdAt >= this.createdAfter, 'createdAt is not greater than before the comment was created');
		Assert(post.modifiedAt >= post.createdAt, 'modifiedAt is not greater than or equal to createdAt');
		this.expectedResponse.post.createdAt = post.createdAt;
		this.expectedResponse.post.modifiedAt = post.modifiedAt;
		(this.expectedResponse.post.mentionedUsers || []).sort((a, b) => {
			return a.email.localeCompare(b.email);
		});
		(data.post.mentionedUsers || []).sort((a, b) => {
			return a.email.localeCompare(b.email);
		});
		Assert.deepStrictEqual(data, this.expectedResponse, 'response data is not correct');
	}
}

module.exports = CreateNRCommentTest;
