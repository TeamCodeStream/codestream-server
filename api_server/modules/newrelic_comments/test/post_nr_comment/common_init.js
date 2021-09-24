// base class for many tests of the "POST /nr-comments" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const DeepClone = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/deep_clone');
const EmailUtilities = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/email_utilities');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeNRCommentData		// make the data to be used during the request
		], callback);
	}

	setTestOptions (callback) {
		this.nrCommentOptions = {};
		this.teamOptions.creatorIndex = 1;
		//this.streamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the generating the NewRelic comment
	makeNRCommentData (callback) {
		this.data = this.nrCommentFactory.getRandomNRCommentData(this.nrCommentOptions);
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': this.data.accountId
			}
		};
		const now = Date.now();
		this.expectedResponse = {
			post: Object.assign(DeepClone(this.data), {
				version: 1,
				createdAt: now, // placeholder
				modifiedAt: now, // placeholder
				deactivated: false,
				seqNum: this.expectedSeqNum || 2,
				mentionedUsers: [],
				reactions: {},
				files: []
			})
		};
		this.expectedResponse.post.creator.username = EmailUtilities.parseEmail(this.data.creator.email).name;
		this.createdAfter = Date.now();
		callback();
	}

	// create the comment for real
	createNRComment (callback) {
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments`,
				data: this.data,
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.data.accountId
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrCommentResponse = response;
				//this.message = response;
				this.requestData = this.data;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}

	registerFauxUser (callback) {
		BoundAsync.series(this, [
			this.registerUser,
			this.confirmUser
		], callback);
	}

	registerUser (callback) {
		// need to register the user so we are authorized to fetch the post
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email: this.nrCommentResponse.post.creator.email,
					password: RandomString.generate(12),
					username: RandomString.generate(12),
					_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat,
					_forceConfirmation: true
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.registerUserResponse = response;
				callback();
			}
		);
	}

	// confirm the mentioned user's registration
	confirmUser (callback) {
		this.doApiRequest({
			method: 'post',
			path: '/no-auth/confirm',
			data: {
				email: this.registerUserResponse.user.email,
				confirmationCode: this.registerUserResponse.user.confirmationCode
			}
		}, (error, response) => {
			if (error) { return callback(error); }
			this.token = response.accessToken;
			callback();
		});
	}
}

module.exports = CommonInit;
