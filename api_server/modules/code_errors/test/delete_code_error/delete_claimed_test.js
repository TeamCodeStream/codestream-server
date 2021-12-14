'use strict';

const DeleteCodeErrorTest = require('./delete_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const Assert = require('assert');

class DeleteClaimedTest extends DeleteCodeErrorTest {

	get description () {
		return 'should return the deleted code error when deleting a code error that was created for the NR comment engine but then claimed by my team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			this.teamOptions.creatorIndex = 0;
			delete this.postOptions.creatorIndex;
			callback();
		});
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodeError,
			this.claimCodeError,
			this.setExpectedData,
			this.setPath
		], callback);
	}

	createCodeError (callback) {
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
				callback();
			}
		);
	}

	// claim code error for the team, as requested
	claimCodeError (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId: this.nrCommentResponse.post.objectId,
					objectType: this.nrCommentResponse.post.objectType
				},
				token: this.users[1].accessToken,
				requestOptions: {
					headers: {
						// allows claiming the code error without an NR account
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.codeError = response.codeError;
				this.post = response.post;
				callback();
			}
		);
	}

	setExpectedData (callback) {
		// wait until we have claimed the code error
		if (!this.nrCommentResponse) { 
			return callback();
		} else {
			super.setExpectedData(() => {
				const replyPost = DeepClone(this.expectedData.posts[0]);
				replyPost.id = replyPost._id = this.nrCommentResponse.post.id
				this.expectedData.posts.push(replyPost);
				callback();
			});
		}
	}

	setPath (callback) {
		// wait until we have claimed the code error
		if (!this.nrCommentResponse) { 
			return callback();
		} else {
			super.setPath(callback);
		}
	}

	validateResponse (data) {
		const replyPost = data.posts[1];
		// verify modifiedAt was updated, and then set it so the deepEqual works
		Assert(replyPost.$set.modifiedAt >= this.modifiedAfter, 'reply post modifiedAt is not greater than before the post was deleted');
		this.expectedData.posts[1].$set.modifiedAt = replyPost.$set.modifiedAt;
		super.validateResponse(data);
	}
}

module.exports = DeleteClaimedTest;
