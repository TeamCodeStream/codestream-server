// base class for many tests of the "PUT /nr-comments/:id" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createNRComment,
			this.makeUpdateData
		], callback);
	}

	setTestOptions (callback) {
		callback();
	}

	createNRComment (callback) {
		const data = this.nrCommentFactory.getRandomNRCommentData();
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: data,
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
				this.path = '/nr-comments/' + response.post.id;
				callback();
			}
		);
	}
	
	// form the data we'll use to do the update
	makeUpdateData (callback) {
		this.data = {
			text: RandomString.generate(1000)
		};
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': this.nrCommentResponse.post.accountId
			}
		};
		const now = Date.now();
		this.expectedResponse = {
			post: Object.assign(DeepClone(this.nrCommentResponse.post), {
				version: 2,
				modifiedAt: now, // placeholder
				...this.data
			})
		};
		this.updatedAfter = now;
		callback();
	}

	// claim code error for the current team
	claimCodeError (callback) {
		const { objectId, objectType } = this.nrCommentResponse.post;
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId,
					objectType
				},
				token: this.users[1].accessToken,
				requestOptions: {
					headers: {
						// allows claiming the code error without an NR account
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			callback
		);
	}

	updateNRComment (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: `/nr-comments/` + this.nrCommentResponse.post.id,
				data: this.data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.nrCommentResponse.post.accountId
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrUpdateResponse = response;
				const post = this.nrCommentResponse.codeStreamResponse.post;
				this.expectedPost = { 
					...post,
					...this.data,
					teamId: this.team.id,
					version: post.version + 1
				};
				this.message = { 
					post: {
						id: post.id,
						_id: post.id,	// DEPRECATE ME
						$set: {
							...this.data,
							modifiedAt: Date.now(),
							version: post.version + 1
						},
						$version: {
							before: post.version,
							after: post.version + 1
						}
					}
				};
				delete this.data;
				callback();
			}
		);
	}
}

module.exports = CommonInit;
