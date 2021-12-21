'use strict';

const AssignNRObjectTest = require('./assign_nr_object_test');
const Assert = require('assert');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class ExistingFauxUserAssignerTest extends AssignNRObjectTest {

	get description () {
		return 'when assigning a user to a New Relic object, if the assigner already exists as a faux user, make that user the creator of the object, if the object does not exist yet';
	}

	// before the test runs...
	before (callback) {
		// create an NR comment with a random creator, then set the creator of our test comment
		// to the same creator (by email)
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.claimCodeError,
			this.inviteAndRegisterFauxUser
		], callback);
	}

	// create an NR comment to create an existing faux user
	createNRComment (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.data.creator.email = data.creator.email;
				this.nrCommentResponse = response;
				callback();
			}
		);
	}

	// run the base test, but then do other stuff...
	run (callback) {
		// run the base test, but then register the creator so we can fetch the posts created,
		// then fetch them
		BoundAsync.series(this, [
			super.run,
			this.fetchPost
		], callback);
	}

	fetchPost (callback) {
		const postId = this.nrAssignmentResponse.codeStreamResponse.post.id;
		const nrCommentPost = this.nrCommentResponse.codeStreamResponse.post;
		this.doApiRequest(
			{
				method: 'get',
				path: '/posts/' + postId,
				token: this.token
			}, 
			(error, response) => {
				if (error) { return callback(error); }
				Assert.equal(response.post.creatorId, nrCommentPost.creatorId, 'creator of the code error (by virtue of assigning someone to it) is not the same as the creator of the comment');
				callback();
			}
		);
	}
}

module.exports = ExistingFauxUserAssignerTest;
