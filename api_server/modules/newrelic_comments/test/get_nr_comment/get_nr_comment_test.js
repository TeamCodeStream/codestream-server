'use strict';

const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const Assert = require('assert');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class GetNRCommentTest extends CodeStreamAPITest {

	get description () {
		return 'should return a New Relic comment when requested';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.createNRComment,
			this.claimCodeError
		], callback);
	}

	// form the data for the generating the NewRelic comment
	makeNRCommentData () {
		const data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
		if (this.ownedByTeam) {
			const user = this.users[1].user;
			Object.assign(data.creator, {
				email: user.email,
				username: user.username,
				fullName: user.fullName
			});
		}
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': data.accountId
			}
		};
		return data;
	}

	// create the comment for real
	createNRComment (callback) {
		const data = this.makeNRCommentData();
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
				this.path = '/nr-comments/' + response.post.id;
				this.expectedResponse = DeepClone(this.nrCommentResponse);
				callback();
			}
		);
	}

	// claim code error for the team, as requested
	claimCodeError (callback) {
		if (!this.ownedByTeam) { return callback(); }
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId: this.nrCommentResponse.post.objectId,
					objectType: this.nrCommentResponse.post.objectType
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	// validate the request response
	validateResponse (data) {
		if (this.modifiedAfter) {
			Assert(data.post.modifiedAt >= this.modifiedAfter, 'modifiedAt not updated');
			this.expectedResponse.post.modifiedAt = data.post.modifiedAt;
		}
		// response should exactly equal the response we got when we created the comment
		Assert.deepStrictEqual(data, this.expectedResponse, 'incorrect response');
	}
}

module.exports = GetNRCommentTest;
