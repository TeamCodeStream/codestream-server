'use strict';

const DeleteNRCommentTest = require('./delete_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends DeleteNRCommentTest {

	get description () {
		return 'should deactivate a New Relic comment when requested through the comment engine, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.claimCodeError,
			this.deleteNRComment,
			this.setPath
		], callback);
	}

	setPath (callback) {
		this.path = `/posts/${this.nrCommentResponse.post.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		Assert(data.post.modifiedAt >= this.deletedAfter, 'modifiedAt not updated');
		this.expectedPost.modifiedAt = data.post.modifiedAt;
		Assert.deepStrictEqual(data.post, this.expectedPost, 'returned post is incorrect');
	}
}

module.exports = FetchTest;
