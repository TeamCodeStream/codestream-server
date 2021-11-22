// base class for many tests of the "PUT /code-errors" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createTeamlessCodeError,
			this.setExpectedData
		], callback);
	}

	// set options to use when running the test
	setTestOptions (callback) {
		this.teamOptions.creatorIndex = 1;
		this.userOptions.numRegistered = 2;
		callback();
	}

	// create a teamless code error through the comment engine
	createTeamlessCodeError (callback) {
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
				this.path = '/code-errors/claim/' + this.team.id;
				this.data = {
					objectId: data.objectId,
					objectType: data.objectType
				};
				callback();
			}
		);
	}

	// set the data expected in the response 
	setExpectedData (callback) {
		const { codeError, codeErrorPost } = this.nrCommentResponse.codeStreamResponse;
		const stream = this.nrCommentResponse.codeStreamResponse.streams[0];
		this.expectedCodeError = {
			...(DeepClone(codeError)),
			teamId: this.team.id,
			followerIds: [
				this.nrCommentResponse.post.creatorId,
				this.currentUser.user.id
			]
		};

		this.expectedPost = {
			...(DeepClone(codeErrorPost)),
			teamId: this.team.id
		};

		this.expectedStream = {
			...(DeepClone(stream)),
			teamId: this.team.id
		};

		this.message = this.expectedData = {
			codeError: this.expectedCodeError,
			post: this.expectedPost,
			stream: this.expectedStream
		};
		callback();
	}

	// perform the actual claim
	claimCodeError (callback) {
		const teamId = this.claimByTeamId || this.team.id;
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + teamId,
				data: this.data,
				token: this.claimByToken || this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.requestData = this.data;
				this.message = response;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}
}

module.exports = CommonInit;
