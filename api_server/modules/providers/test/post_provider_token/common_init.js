// common initialization for tests of the "POST /no-auth/provider-token" request,
// these tests are specifically concerned with providers that support authentication
// for login, and test that the appropriate users/teams/etc. are created or matched
// in conjunction with using third-party providers for login

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid/v4');

class CommonInit {

	init(callback) {
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.setProviderToken,	// make the provider-token request
			this.wait,				// wait for signup token to be saved
			this.waitForSignupToken	// wait for our signup token to be validated
		], callback);
	}

	setTestOptions(callback) {
		// by default, we will have no teams and no users created ahead of time,
		// then we will test the scenario where these are actually created in 
		// conjunction with the authentication
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		callback();
	}

	// make the provider-token request to set the user's access token for the given provider,
	// and perform whatever identity matching we expect to happen
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	setProviderToken(callback) {
		this.signupToken = UUID();
		this.providerUserId = this.useProviderUserId || RandomString.generate(8);
		this.providerTeamId = this.useProviderTeamId || RandomString.generate(8);
		this.code = `mock-${this.providerUserId}-${this.providerTeamId}`;
		this.mockToken = RandomString.generate(16);
		const path = `/no-auth/provider-token/${this.provider}`;
		const data = this.getRequestBody();
		if (this.runRequestAsTest) {
			// in this case, the actual test is actually making the request, so just prepare the path
			this.path = path;
			this.data = data;
			this.method = 'post';
			return callback();
		}
		this.path = '/users/me';
		this.doApiRequest(
			{
				method: 'post',
				path: path,
				data
			},
			(error, data, response) => {
				this.providerTokenResponse = response;
				this.providerTokenData = data;
				callback(error);
			}
		);
	}

	// return the request body to use when constructing the data to use in the test request
	getRequestBody() {
		return {
			code: this.code,
			token: this.mockToken,
			signup_token: this.signupToken,
			_mockToken: this.mockToken, // avoids calling out to the actual provider service
			_secret: this.apiConfig.sharedSecrets.confirmationCheat
		};
	}

	// wait for the signup token to be saved before we start checking
	wait(callback) {
		setTimeout(callback, 1000);
	}

	// wait for our signup token to be validated ... just like the IDE, we use the signup token
	// to know when authentication is complete
	waitForSignupToken(callback) {
		this.numAttempts = 0;
		BoundAsync.whilst(
			this,
			() => {
				return !this.signupResponse && this.numAttempts < 10;
			},
			this.checkSignupToken,
			error => {
				if (error) { return callback(error); }
				if (!this.signupResponse) {
					return callback('signup token never validated');
				}
				else {
					return callback();
				}
			}
		);
	}

	// check our signup token, when it is valid, we have a CodeStream user
	checkSignupToken(callback) {
		// check our signup token, when we get a valid response, we're done
		this.doApiRequest(
			{
				method: 'put',
				path: '/no-auth/check-signup',
				data: {
					token: this.signupToken
				}
			},
			(error, data) => {
				if (error) {
					if (data.code === 'AUTH-1003') {
						this.numAttempts++;
						setTimeout(callback, 1000);
					}
					else if (this.expectError) {
						this.signupError = data;
						this.signupResponse = true;
						callback();
					}
					else {
						callback(error);
					}
				}
				else {
					this.signupResponse = data;
					this.token = this.signupResponse.accessToken;
					callback();
				}
			}
		);
	}
}

module.exports = CommonInit;
