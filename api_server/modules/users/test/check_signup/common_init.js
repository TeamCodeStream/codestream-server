// common initialization for tests of the "GET /no-auth/signup-token" request,
// to retrieve signup info for a user after they have gone through a third-party provider
// signup flow

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid').v4;
const DetermineCapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/determine_capabilities');

class CommonInit {

	init (callback) {
		this.provider = 'github'; // whatever
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.doProviderAuth,	// simulate the web-based provider auth process, to get the proper state variable
			this.setProviderToken,	// make the provider-token request
			this.determineExpectedCapabilities, // determine what are the expected capabilities returned in the response
			this.setRequestData, 	// set the data to use making the test request
			this.wait,				// wait for signup token to be saved
//			this.waitForSignupToken	// wait for our signup token to be validated
		], callback);
	}

	setTestOptions (callback) {
		// by default, we will have no teams and no users created ahead of time,
		// then we will test the scenario where these are actually created in 
		// conjunction with the authentication
		this.userOptions.numRegistered = 0;
		delete this.teamOptions.creatorIndex;
		callback();
	}

	// simulate the web-based provider auth process, to get the proper state variable 
	// to provide to the provider-token request, the state variable is normally generated
	// in the web-based authentication process, which takes us into the third-party
	// provider's permissions page, and then calls back to the provider-token request
	doProviderAuth (callback) {
		const parameters = this.getProviderAuthParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.doApiRequest(
			{
				method: 'get',
				path: `/web/provider-auth/${this.provider}?${query}`
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.state = response.state;
				callback();
			}
		);
	}

	// get parameter to use in the provider-auth request that kicks the authentication off
	// here we will actually simulate the process, not actually redirecting to the third-party
	// provider's permissions page
	getProviderAuthParameters () {
		this.signupToken = UUID();
		return { 
			_returnState: true,
			signupToken: this.signupToken
		};
	}

	// make the provider-token request to set the user's access token for the given provider,
	// and perform whatever identity matching we expect to happen
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	setProviderToken (callback) {
		this.providerUserId = this.useProviderUserId || RandomString.generate(8);
		this.providerTeamId = this.useProviderTeamId || RandomString.generate(8);
		this.code = `mock-${this.providerUserId}-${this.providerTeamId}`;
		this.mockToken = RandomString.generate(16);
		const path = this.getProviderTokenPath();
		const headers = {
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
		};
		this.doApiRequest(
			{
				method: 'get',
				path: path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true,
					headers
				}
			},
			(error, data, response) => {
				this.providerTokenResponse = response;
				this.providerTokenData = data;
				callback(error);
			}
		);
	}

	// get the path to use in the test request
	getProviderTokenPath () {
		const parameters = this.getProviderTokenQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `/no-auth/provider-token/${this.provider}?${query}`;
	}

	// return the query parameters to use when constructing the path to use in the provider-token request
	getProviderTokenQueryParameters () {
		if (!this.mockEmail && this.wantWebmail) {
			this.mockEmail = this.userFactory.randomEmail({ wantWebmail: true });
		}
		const params = {
			code: this.code,
			state: this.state,
			_mockToken: this.mockToken
		};
		if (this.mockEmail) {
			params._mockEmail = this.mockEmail;
		}
		if (this.expiresIn) {
			params.expires_in = `${this.expiresIn}`;
		}
		return params;
	}

	// determine what are the expected capabilities returned in the response
	determineExpectedCapabilities (callback) {
		(async () => {
			this.expectedCapabilities = await DetermineCapabilities({ config: this.apiConfig });
			callback();
		})();
	}
		
	// set the data to use making the test request
	setRequestData (callback) {
		this.data = {
			token: this.signupToken
		};
		callback();
	}

	// wait for the signup token to be saved before we start checking
	wait (callback) {
		const waitTime = this.waitTime || 1000;
		setTimeout(callback, waitTime);
	}

	/*
	// wait for our signup token to be validated ... we use the signup token
	// to know when authentication is complete
	waitForSignupToken (callback) {
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
	checkSignupToken (callback) {
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
	*/
}

module.exports = CommonInit;
