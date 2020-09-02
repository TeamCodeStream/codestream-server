// base class for many tests of the "GET /no-auth/provider-refresh" requests

'use strict';

const BoundAsync = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/test_base/codestream_api_test');
const Base64 = require('base-64');

class CommonInit {

	init (callback) {
		// since we're just doing a mock-up here, we won't actually have a valid refresh token anyway,
		// so we'll skip obtaining a token in the first place and just go through the motions
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.addTestHost,	// add simulated enterprise host, as needed
			this.getAuthCode,	// get an auth-code to use in the provider-token request
			this.setProviderToken,	// make the provider-token request, this sets the original access token
			this.getUser,		// fetch the user object, so we have the original access token
			this.refreshToken	// make the provider-refresh request, the real test is fetching the user object and making sure a new token has been set
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
					},
					_confirmationCheat: this.apiConfig.sharedSecrets.confirmationCheat
				},
				token: this.token
			},
			callback
		);
	}

	// get an auth-code for initiating the authorization flow
	getAuthCode (callback) {
		const path = '/provider-auth-code?teamId=' + this.team.id;
		this.doApiRequest(
			{
				method: 'get',
				path,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.authCode = response.code;
				this.redirectUri = `${this.apiConfig.apiServer.authOrigin}/provider-token/${this.provider}`;
				this.state = `${this.apiConfig.apiServer.callbackEnvironment}!${this.authCode}`;
				if (this.testHost) {
					this.state += `!${this.testHost}`;
				}
				callback();
			}
		);
	}

	// make the provider-token request to set the user's access token for the given provider,
	// we'll then do the refresh request and verify that the original access token has been replaced
	// note that this is a mock test, there is no actual call made to the provider
	setProviderToken (callback) {
		this.code = RandomString.generate(16);
		this.firstMockToken = RandomString.generate(16);
		this.refreshedMockToken = RandomString.generate(16);
		const parameters = {
			code: this.code,
			state: this.state,
			_mockToken: this.firstMockToken,
			_secret: this.apiConfig.sharedSecrets.confirmationCheat
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		this.doApiRequest(
			{
				method: 'get',
				path: `/no-auth/provider-token/${this.provider}?${query}`,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			() => {
				setTimeout(callback, 200);
			}
		);
	}


	// fetch the user, which should have an access token set
	getUser (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/users/me',
				token: this.token
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.user = response.user;
				let providerInfo = this.user.providerInfo[this.team.id][this.provider];
				if (this.testHost) {
					const starredHost = this.testHost.replace(/\./g, '*');
					providerInfo = providerInfo.hosts[starredHost];
				}
				this.refreshToken = providerInfo.refreshToken;
				callback();
			}
		);
	} 
	
	// make the token refresh request to set a new access token for the given provider,
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	refreshToken (callback) {
		const path = this.getPath();
		if (this.runRequestAsTest) {
			// in this case, the actual test is actually making the request, so just prepare the path
			this.path = path;
			return callback();
		}
		this.path = '/users/me';
		this.doApiRequest(
			{
				method: 'get',
				path: path,
				token: this.token
			},
			callback
		);

	}
	// get the path to use in the test request
	getPath () {
		const parameters = this.getQueryParameters();
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		return `/provider-refresh/${this.provider}?${query}`;
	}

	// return the query parameters to use when constructing the path to use in the test request
	getQueryParameters () {
		const parameters = {
			teamId: this.team.id,
			refreshToken: this.refreshToken,
			_mockToken: this.refreshedMockToken
		};
		if (this.testHost) {
			parameters.host = this.testHost;
		}
		return parameters;
	}

	getExpectedAsanaTestCallData () {
		const parameters = {
			grant_type: 'refresh_token',
			client_id: this.apiConfig.integrations.asana.appClientId,
			client_secret: this.apiConfig.integrations.asana.appClientSecret,
			refresh_token: this.refreshToken,
			redirect_uri: this.redirectUri
		};
		const url = 'https://app.asana.com/-/oauth_token';
		return { url, parameters };
	}

	getExpectedJiraTestCallData () {
		const parameters = {
			grant_type: 'refresh_token',
			client_id: this.apiConfig.integrations.jira.appClientId,
			client_secret: this.apiConfig.integrations.jira.appClientSecret,
			refresh_token: this.refreshToken,
			redirect_uri: this.redirectUri
		};
		const url = 'https://auth.atlassian.com/oauth/token';
		return { url, parameters };
	}

	getExpectedGitlabTestCallData () {
		const appClientId = this.testHost ? 'testClientId' : this.apiConfig.integrations.gitlab.appClientId;
		const appClientSecret = this.testHost ? 'testClientSecret' : this.apiConfig.integrations.gitlab.appClientSecret;
		const parameters = {
			redirect_uri: this.redirectUri,
			grant_type: 'refresh_token',
			client_id: appClientId,
			client_secret: appClientSecret,
			refresh_token: this.refreshToken
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const host = this.testHost || 'https://gitlab.com';
		const url = `${host}/oauth/token?${query}`;
		return { url, parameters };
	}

	getExpectedBitbucketTestCallData () {
		const parameters = {
			refresh_token: this.refreshToken,
			grant_type: 'refresh_token',
			redirect_uri: this.redirectUri
		};
		const userAuth = Base64.encode(`${this.apiConfig.integrations.bitbucket.appClientId}:${this.apiConfig.integrations.bitbucket.appClientSecret}`);
		const url = 'https://bitbucket.org/site/oauth2/access_token';
		return { url, parameters, userAuth };
	}

	getExpectedAzureDevOpsTestCallData () {
		const parameters = {
			redirect_uri: this.redirectUri,
			grant_type: 'refresh_token',
			client_id: this.apiConfig.integrations.azuredevops.appClientId,
			client_assertion: this.apiConfig.integrations.azuredevops.appClientSecret,
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			assertion: this.refreshToken
		};
		const url = 'https://app.vssps.visualstudio.com/oauth2/token';
		return { url, parameters };
	}

	getExpectedMSTeamsTestCallData () {
		const parameters = {
			refresh_token: this.refreshToken,
			grant_type: 'refresh_token',
			client_id: this.apiConfig.integrations.msteams.appClientId,
			client_secret: this.apiConfig.integrations.msteams.appClientSecret,
			redirect_uri: this.redirectUri
		};
		const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
		return { url, parameters };
	}
}

module.exports = CommonInit;
