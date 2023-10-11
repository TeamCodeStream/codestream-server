// base class for many tests of the "GET /~nrlogin" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const UUID = require('uuid').v4;
const RandomString = require('randomstring');

class NRLoginCommonInit {

	init (callback) {
		// get an auth-code and set the token, the test itself is verifying the token has been set in the user object
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.createCompany,		// create existing company, as needed
			this.waitForCompanySignup, // wait for the created company to exist and result in a valid signup token
			this.setProviderToken,	// make the provider-token request
			this.wait,				// wait for signup token to be saved
			this.waitForSignupToken	// wait for our signup token to be validated
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

	// create an existing company, linked to an NR org, as needed
	createCompany (callback) {
		if (!this.wantExistingCompany) { return callback(); }

		// do an ~nrlogin, with random user, this will create a company linked to a random NR org
		this.signupToken = UUID();
		const mockUser = this.getMockUser();
		const headers = {
			'X-CS-NR-Mock-User': JSON.stringify(mockUser),
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
		};

		const path = `/~nrlogin/${this.signupToken}?code=${RandomString.generate(100)}`;
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

	// wait for the company created in the last step to exist, when the signup token is valid
	waitForCompanySignup (callback) {
		if (!this.wantExistingCompany) { return callback(); }

		setTimeout(() => {
			this.doApiRequest(
				{
					method: 'put',
					path: '/no-auth/check-signup',
					data: {
						token: this.signupToken
					}
				},
				(error, data) => {
					if (error) { return callback(error); }
					this.createCompanyResponse = data;
					callback();
				}
			);
		}, 1000);
	}

	// make the provider-token request to set the user's access token for the given provider,
	// and perform whatever identity matching we expect to happen
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	setProviderToken (callback) {
		this.nrUserId = this.getMockNRUserId();
		this.code = RandomString.generate(100);
		this.mockUser = this.getMockUser();
		const headers = {
			'X-CS-NR-Mock-User': JSON.stringify(this.mockUser),
			'X-CS-Mock-Secret': this.apiConfig.sharedSecrets.confirmationCheat
		};
		const path = this.getPath();
		if (this.wantError) {
			// in this case, the actual test is actually making the request, so just do a NOOP for the test request
			this.path = '/no-auth/status';
		} else {
			this.path = '/users/me';
		}
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

	// get a mock user to use for the request
	getMockUser () {
		return  {
			email: this.userFactory.randomEmail(),
			name: this.userFactory.randomFullName(),
			nr_userid: this.nrUserId || this.getMockNRUserId(),
			nr_orgid: UUID(),
		};
	}

	// get the path to use in the test request
	getPath () {
		this.signupToken = UUID();
		this.anonUserId = UUID();
		let path = `/~nrlogin/${this.signupToken}.AUID~${this.anonUserId}`;
		if (this.noSignup) {
			path += '.NOSU~1';
		}
		const parameters = this.getQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `${path}?${query}`;
	}

	// return the query parameters to use when constructing the path to use in the test request
	getQueryParameters () {
		return {
			code: this.code
		};
	}

	// wait for the signup token to be saved before we start checking
	wait (callback) {
		setTimeout(callback, 1000);
	}

	// wait for our signup token to be validated ... just like the IDE, we use the signup token
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
				} else {
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
					if (data.code === 'AUTH-1006') {
						this.numAttempts++;
						setTimeout(callback, 1000);
					} else if (this.wantError) {
						this.signupError = data;
						this.signupResponse = true;
						callback();
					} else {
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

	getMockNRUserId () {
		return (1000000000 + Math.floor(Math.random() * 999999999)).toString();
	}
}

module.exports = NRLoginCommonInit;
