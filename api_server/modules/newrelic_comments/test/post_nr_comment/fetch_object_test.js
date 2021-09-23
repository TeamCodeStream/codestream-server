'use strict';

const FetchTest = require('./fetch_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchObjectTest extends FetchTest {

	get description () {
		return 'should create a New Relic object (code error) and post as parent when creating a New Relic comment, checked by fetching the code error';
	}

	get method () {
		return 'get';
	}

	// run the original test, but then also fetch the created code error
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.fetchCodeError
		], callback);
	}

	fetchCodeError (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.nrCommentResponse.post.parentPostId,
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { post, codeError } = response;
				Assert.equal(post.id, this.nrCommentResponse.post.parentPostId, 'fetched post is not the parent of the comment created');
				Assert.equal(post.codeErrorId, codeError.id, 'fetched post does not point to the created code error');
				Assert.equal(codeError.postId, post.id, 'fetched code error does not point to the created post');
				callback();
			}
		);
	}
}

module.exports = FetchObjectTest;
