'use strict';

const DeletePostTest = require('./delete_post_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class DeletePostFetchTest extends DeletePostTest {

	get description () {
		return 'should properly deactivate a post when deleted, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	getExpectedFields () {
		return { post: PostTestConstants.EXPECTED_POST_FIELDS };
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,	// do the usual test prep
			this.deletePost	// perform the actual deletion
		], callback);
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.post.modifiedAt >= this.modifiedAfter, 'modifiedAt is not greater than before the post was updated');
		this.expectedPost.modifiedAt = data.post.modifiedAt;
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.post, this.expectedPost, 'fetched post does not match');
	}
}

module.exports = DeletePostFetchTest;
