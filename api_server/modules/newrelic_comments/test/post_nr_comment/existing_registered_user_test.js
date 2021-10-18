'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingRegisteredUserTest extends CreateNRCommentTest {

	get description () {
		return 'when creating a New Relic comment, if the user already exists as a registered user, make that user the creator of the comment';
	}

	makeNRCommentData (callback) {
		// use an existing registered as the creator of the comment
		super.makeNRCommentData(error => {
			if (error) { return callback(error); }
			const { user } = this.users[0];
			this.data.creator.email = user.email;
			Object.assign(this.expectedResponse.post.creator, {
				email: user.email,
				fullName: user.fullName,
				username: user.username
			});
			this.expectedResponse.post.userMaps.placeholder = { ...this.expectedResponse.post.creator };
			callback();
		});
	}

	// run the base test, but then do other stuff...
	run (callback) {
		// run the base test, but then fetch the post created 
		BoundAsync.series(this, [
			super.run,
			this.claimCodeError,
			this.fetchPost
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// save the fetched post, so we can fetch it by ID
		this.fetchedPost = data.post;
		super.validateResponse(data);
	}

	// fetch the first comment we created
	fetchPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.fetchedPost.id,
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.post.creatorId, this.users[0].user.id, 'creator of the post is not equal to the correct user');
				callback();
			}
		);
	}
}

module.exports = ExistingRegisteredUserTest;
