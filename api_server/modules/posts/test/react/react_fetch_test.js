'use strict';

const ReactTest = require('./react_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const PostTestConstants = require('../post_test_constants');

class ReactFetchTest extends ReactTest {

	get description () {
		return 'should properly update a post when reacted to, checked by fetching the post';
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
			this.doReaction	// do the actual reaction to the post
		], callback);
	}

	// do the actual reaction to the post
	// the actual test is reading the post and verifying it is correct
	doReaction (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/react/' + this.post.id,
				data: this.data,
				token: this.token
			},
			error => {
				if (error) { return callback(error); }
				delete this.data;	// don't need this anymore
				this.path = '/posts/' + this.post.id;
				this.expectedReactions = {
					[this.reaction]: [this.currentUser.user.id]
				};
				callback();
			}
		);
	}

	// validate that the response is correct
	validateResponse (data) {
		// verify what we fetch is what we got back in the response
		Assert.deepEqual(data.post.reactions, this.expectedReactions, 'fetched post reactions attribute does not match');
	}
}

module.exports = ReactFetchTest;
