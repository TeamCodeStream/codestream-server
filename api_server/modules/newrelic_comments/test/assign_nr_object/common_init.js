// base class for many tests of the "POST /nr-comments/assign" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const RandomString = require('randomstring');

class CommonInit {

	init (callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.makeNRRequestData		// make the data to be used during the request
		], callback);
	}

	setTestOptions (callback) {
		this.nrCommentOptions = {};
		this.teamOptions.creatorIndex = 1;
		callback();
	}

	// form the data for the generating the NewRelic object assignment
	makeNRRequestData (callback) {
		this.data = this.nrCommentFactory.getRandomNRAssignmentData(this.nrCommentOptions);
		this.apiRequestOptions = {
			headers: {
				'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
				'X-CS-NewRelic-AccountId': this.data.accountId
			}
		};
		callback();
	}

	// do the assignment for real
	createNRAssignment (callback) {
		this.createdAfter = Date.now();
		this.doApiRequest(
			{
				method: 'post',
				path: `/nr-comments/assign`,
				data: this.data,
				testEmails: this.testEmailNotification,	// this should get us email data back in the pubnub me-channel
				requestOptions: {
					headers: {
						'X-CS-NewRelic-Secret': this.apiConfig.sharedSecrets.commentEngine,
						'X-CS-NewRelic-AccountId': this.data.accountId,
						'X-CS-Want-CS-Response': this.apiConfig.sharedSecrets.commentEngine
					}
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.nrAssignmentResponse = response;
				this.requestData = this.data;
				delete this.data;	// don't need this anymore
				callback();
			}
		);
	}

	// claim code error for the team, as requested
	claimCodeError (callback) {
		const data = this.requestData || this.data;
		this.doApiRequest(
			{
				method: 'post',
				path: '/code-errors/claim/' + this.team.id,
				data: {
					objectId: data.objectId,
					objectType: data.objectType
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

	inviteAndRegisterFauxUser (callback) {
		BoundAsync.series(this, [
			this.inviteFauxUser,
			this.registerUser,
			this.confirmUser
		], callback);
	}

	inviteFauxUser (callback) {
		const userToRegister = this.userToRegister || 'creator';
		this.doApiRequest(
			{
				method: 'post',
				path: '/users',
				data: {
					teamId: this.team.id,
					email: this.requestData[userToRegister].email
				},
				token: this.users[1].accessToken
			},
			callback
		);
	}

	registerUser (callback) {
		// need to register the user so we are authorized to fetch the post
		const userToRegister = this.userToRegister || 'creator';
		this.doApiRequest(
			{
				method: 'post',
				path: '/no-auth/register',
				data: {
					email: this.requestData[userToRegister].email,
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
