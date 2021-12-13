'use strict';

const UpdateNRCommentTest = require('./update_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends UpdateNRCommentTest {

	get description () {
		return 'should update a post through the New Relic comment engine when requested, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.claimCodeError,
			this.updateNRComment,
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = `/posts/${this.nrCommentResponse.post.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.post.modifiedAt >= this.updatedAfter, 'modifiedAt not updated');
		this.expectedPost.modifiedAt = data.post.modifiedAt;
		Assert.deepStrictEqual(data.post, this.expectedPost, 'returned post is incorrect');
	}
}

module.exports = FetchTest;
