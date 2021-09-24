'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchTest extends CreateNRCommentTest {

	get description () {
		return 'should create a post when creating a New Relic comment, checked by fetching the post';
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.setPath,
			this.registerFauxUser
		], callback);
	}

	setPath (callback) {
		this.path = `/posts/${this.nrCommentResponse.post.id}`;
		callback();
	}

	// validate that the response is correct
	validateResponse (data) {
		this.fetchedPost = data.post;
		Assert.equal(data.post.id, this.nrCommentResponse.post.id, 'fetched post not equal to the post given in the response');
		Assert.equal(data.post.text, this.nrCommentResponse.post.text, 'text of fetched post does not match the text sent');
	}
}

module.exports = FetchTest;
