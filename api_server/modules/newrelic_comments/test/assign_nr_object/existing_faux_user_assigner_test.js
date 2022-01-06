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
			this.createNRComment
		], callback);
	}

	makeNRRequestData (callback) {
		super.makeNRRequestData(error => {
			if (error) { return callback(error); }
			this.apiRequestOptions.headers['X-CS-Want-CS-Response'] = this.apiConfig.sharedSecrets.commentEngine;
			callback();
		});
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
				this.nrCommentResponse = response;
				this.data.creator.email = response.post.creator.email;
				callback();
			}
		);
	}

	validateResponse (data) {
		const commentCreatorId = this.nrCommentResponse.post.creatorId;
		const assignmentCreatorId = data.codeStreamResponse.post.creatorId;
		Assert.equal(assignmentCreatorId, commentCreatorId, 'creator of the code error (by virtue of assigning someone to it) is not the same as the creator of the earlier comment');
		delete data.codeStreamResponse;
		super.validateResponse(data);
	}
}

module.exports = ExistingFauxUserAssignerTest;
