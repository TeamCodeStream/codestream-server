'use strict';

const PutCodeErrorTest = require('./put_code_error_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');

class UpdateClaimedTest extends PutCodeErrorTest {

	get description () {
		return 'should return the updated code error when updating a code error that was created for the NR comment engine but then claimed by my team';
	}

	setTestOptions (callback) {
		super.setTestOptions(() => {
			delete this.postOptions.creatorIndex;
			callback();
		});
	}

	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createCodeError,
			this.claimCodeError,
			this.makeCodeErrorUpdateData
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
						'X-CS-NewRelic-AccountId': data.accountId
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
				callback();
			}
		);
	}

	makeCodeErrorUpdateData (callback) {
		// wait until we have claimed the code error
		if (!this.nrCommentResponse) { 
			return callback();
		} else {
			super.makeCodeErrorUpdateData(callback);
		}
	}
}

module.exports = UpdateClaimedTest;
