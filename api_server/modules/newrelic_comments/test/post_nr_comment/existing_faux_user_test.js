'use strict';

const CreateNRCommentTest = require('./create_nr_comment_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingFauxUserTest extends CreateNRCommentTest {

	get description () {
		return 'when creating a New Relic comment, if the user already exists as a faux user, make that user the creator of the comment';
	}

	// before the test runs...
	before (callback) {
		// create an NR comment with a random creator, then set the creator of our test comment
		// to the same creator (by email)
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.setCreator
		], callback);
	}

	// set the creator of the test comment to the creator of the first comment,
	// this should result in the same user
	setCreator (callback) {
		this.data = this.requestData;
		this.data.creator.email = this.nrCommentResponse.post.creator.email;
		this.expectedResponse.post.seqNum++;
		callback();
	}

	// run the base test, but then do other stuff...
	run (callback) {
		// run the base test, but then register the creator so we can fetch the posts created,
		// then fetch them
		BoundAsync.series(this, [
			super.run,
			this.registerFauxUser,
			this.fetchFirstPost,
			this.fetchSecondPost
		], callback);
	}

	// validate the response to the test request
	validateResponse (data) {
		// save the fetched post, so we can fetch it by ID
		this.fetchedPost = data.post;
		super.validateResponse(data);
	}

	// fetch the first comment we created
	fetchFirstPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.nrCommentResponse.post.id,
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				this.firstPost = response.post;
				callback();
			}
		);
	}

	// fetch the second post we created and confirm that the creators of both posts turned out
	// to be the same user
	fetchSecondPost (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + this.fetchedPost.id,
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(this.firstPost.creatorId, response.post.creatorId, 'creator of second post is not the creator of the first post');
				Assert.equal(this.firstPost.teamId, response.post.teamId, 'first post and second post are not owned by the same team');
				callback();
			}
		);
	}
}

module.exports = ExistingFauxUserTest;
