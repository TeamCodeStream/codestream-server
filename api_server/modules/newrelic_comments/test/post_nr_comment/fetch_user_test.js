'use strict';

const FetchTest = require('./fetch_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');

class FetchUserTest extends FetchTest {

	get description () {
		return 'should create a faux user when creating a New Relic comment with a new email, checked by fetching the user (after registration)';
	}

	get method () {
		return 'get';
	}

	// run the original test, but then also fetch the created user
	run (callback) {
		BoundAsync.series(this, [
			super.run,
			this.fetchUser
		], callback);
	}

	fetchUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				const { user } = response;
				Assert.equal(user.id, this.fetchedPost.creatorId, 'fetched user is not the creator of the comment');
				Assert.equal(user.teamIds[0], this.fetchedPost.teamId, 'user is not on the team that owns the NR object');
				Assert.equal(user.email, this.nrCommentResponse.post.creator.email, 'user\'s email does not match the email of the comment creator');
				callback();
			}
		);
	}
}

module.exports = FetchUserTest;
