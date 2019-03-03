// base class for many tests of the "PUT /provider-deauth" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const GithubConfig = require(process.env.CS_API_TOP + '/config/github');
const AsanaConfig = require(process.env.CS_API_TOP + '/config/asana');
const JiraConfig = require(process.env.CS_API_TOP + '/config/jira');
const BitbucketConfig = require(process.env.CS_API_TOP + '/config/bitbucket');
const Base64 = require('base-64');
const URL = require('url');

class CommonInit {

	init (callback) {
		// get an auth-code and set the token
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.getAuthCode,	// get an auth-code to use in the provider-token request
			this.setProviderToken,	// make the provider-token request
			this.setExpectedResponse,	// set the expected response or message
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		callback();
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
				if (this.testOrigin) {
					this.origin = `https://${this.testOrigin}`;
					this.state += `!${encodeURIComponent(this.origin)}`;
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
		if (this.origin) {
			const host = encodeURIComponent(URL.parse(this.origin).host).replace(/\./g, '*');
			this.data.host = host;
			key += `.origins.${host}`;
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
			_mockToken: this.mockToken
		};
	}

	getExpectedGithubTestCallData () {
		const parameters = {
			client_id: GithubConfig.appClientId,
			client_secret: GithubConfig.appClientSecret,
			code: this.code,
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const origin = this.origin || 'https://github.com';
		const url = `${origin}/login/oauth/access_token?${query}`;
		return { url, parameters };
	}

	getExpectedAsanaTestCallData () {
		const parameters = {
			grant_type: 'authorization_code',
			client_id: AsanaConfig.appClientId,
			client_secret: AsanaConfig.appClientSecret,
			code: this.code,
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const url = 'https://app.asana.com/-/oauth_token';
		return { url, parameters };
	}

	getExpectedJiraTestCallData () {
		const parameters = {
			grant_type: 'authorization_code',
			client_id: JiraConfig.appClientId,
			client_secret: JiraConfig.appClientSecret,
			code: this.code,
			redirect_uri: this.redirectUri
		};
		const url = 'https://auth.atlassian.com/oauth/token';
		return { url, parameters };
	}

	getExpectedBitbucketTestCallData () {
		const parameters = {
			code: this.code,
			grant_type: 'authorization_code',
			redirect_uri: this.redirectUri
		};
		const userAuth = Base64.encode(`${BitbucketConfig.appClientId}:${BitbucketConfig.appClientSecret}`);
		const url = 'https://bitbucket.org/site/oauth2/access_token';
		return { url, parameters, userAuth };
	}
}

module.exports = CommonInit;
