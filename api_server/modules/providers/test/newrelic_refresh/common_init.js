// base class for many tests of the "PUT /no-auth/provider-refresh/newrelic" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid').v4;

class CommonInit {

	init (callback) {
		// since we're just doing a mock-up here, we won't actually have a valid refresh token anyway,
		// so we'll skip obtaining a token in the first place and just go through the motions
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.doNRLogin,	// do an ~nrlogin, with random user, this will create a company linked to a random NR org
			this.doSignin	// sign in with the created user (by signup token)
		], callback);
	}

	setTestOptions (callback) {
		// don't need preset users or team
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		callback();
	}

	// do an ~nrlogin, with random user, this will create a company linked to a random NR org
	doNRLogin (callback) {
		this.signupToken = UUID();
		this.mockUser = this.getMockUser();
		if (this.wantIDToken) {
			this.mockUser.wantIDToken = true;
		}
		const headers = {
			'X-CS-NR-Mock-User': JSON.stringify(this.mockUser),
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
		};

		const path = `/~nrlogin/${this.signupToken}?auth_code=${RandomString.generate(100)}`;
		this.doApiRequest(
			{
				method: 'get',
				path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true,
					headers
				}
			},
			callback
		);
	}
	
	// sign in with the created user (by signup token)
	doSignin (callback) {
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/check-signup',
				data: {
					token: this.signupToken
				}
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.signupResponse = response;
				this.data = {
					refreshToken: response.accessTokenInfo.refreshToken
				}
				this.apiRequestOptions = {
					headers: {
						'X-CS-NR-Mock-User': JSON.stringify(this.mockUser),
						'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
					}
				};
				callback();
			}
		);
	}
	// get a mock user to use for the request
	getMockUser () {
		return  {
			email: this.userFactory.randomEmail(),
			name: this.userFactory.randomFullName(),
			nr_userid: this.nrUserId || this.getMockNRUserId(),
			nr_orgid: UUID()
		};
	}

	getMockNRUserId () {
		return (1000000000 + Math.floor(Math.random() * 999999999)).toString();
	}
}

module.exports = CommonInit;
