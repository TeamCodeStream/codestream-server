// base class for many tests of the "PUT /provider-deauth" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');
const TokenHandler = require(process.env.CS_API_TOP + '/server_utils/token_handler');

class CommonInit {

	init (callback) {
		// get an auth-code and set the token
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.addTestHost,	// add simulated enterprise host, as needed
			this.getAuthCode,	// get an auth-code to use in the provider-token request
			this.setProviderToken,	// make the provider-token request
			this.setExpectedResponse	// set the expected response or message
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		callback();
	}

	// add a test-host for testing enterprise connections, as needed
	addTestHost (callback) {
		if (!this.testHost) {
			return callback();
		}
		const starredHost = this.testHost.replace(/\./g, '*');
		this.doApiRequest(
			{
				method: 'put',
				path: '/teams/' + this.team.id,
				data: {
					providerHosts: {
						[this.provider]: {
							[starredHost]: {
								appClientId: 'testClientId',
								appClientSecret: 'testClientSecret'
							}
						}
					}
				},
				token: this.token
			},
			callback
		);
	}

	// get an auth-code for initiating the authorization flow
	getAuthCode (callback) {
		let path = '/provider-auth-code?teamId=' + this.team.id;
		this.doApiRequest(
			{
				method: 'get',
				path,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.authCode = response.code;
				this.redirectUri = `${ApiConfig.authOrigin}/provider-token/${this.provider}`;
				this.state = `${ApiConfig.callbackEnvironment}!${this.authCode}`;
				if (this.testHost) {
					this.state += `!${this.testHost}`;
				}
				if (this.provider === 'jiraserver') {
					this.oauthTokenSecret = RandomString.generate(10);
					const encodedSecret = new TokenHandler(SecretsConfig.auth).generate({ sec: this.oauthTokenSecret }, 'oasec');
					this.state += `!${encodedSecret}`;
				}
				callback();
			}
		);
	}

	// make the provider-token request to set the user's access token for the given provider
	setProviderToken (callback) {
		this.code = RandomString.generate(16);
		this.mockToken = RandomString.generate(16);
		const path = this.getPath();
		this.requestSentAfter = Date.now();		
		this.doApiRequest(
			{
				method: 'get',
				path: path,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
		);
	}

	// set the expected response and/or message
	setExpectedResponse (callback) {
		this.path = `/provider-deauth/${this.provider}`;
		this.data = {
			teamId: this.team.id
		};
		let key = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.testHost) {
			const host = this.testHost.replace(/\./g, '*');
			this.data.host = host;
			key += `.hosts.${host}`;
		}
		this.message = this.expectedResponse = {
			user: {
				_id: this.currentUser.user.id, 	// DEPRECATE ME
				id: this.currentUser.user.id,
				$unset: {
					[key]: true
				},
				$set: {
					version: 5,
					modifiedAt: Date.now()
				},
				$version: {
					before: 4,
					after: 5
				}
			}
		};
		callback();
	}

	// get the path to use in the test request
	getPath () {
		const parameters = this.getQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `/no-auth/provider-token/${this.provider}?${query}`;
	}

	// return the query parameters to use when constructing the path to use in the test request
	getQueryParameters () {
		return {
			code: this.code,
			state: this.state,
			_mockToken: this.mockToken,
			_secret: SecretsConfig.confirmationCheat
		};
	}
}

module.exports = CommonInit;
