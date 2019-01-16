// base class for many tests of the "GET /no-auth/provider-refresh" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const AsanaConfig = require(process.env.CS_API_TOP + '/config/asana');
const JiraConfig = require(process.env.CS_API_TOP + '/config/jira');
const GitlabConfig = require(process.env.CS_API_TOP + '/config/gitlab');
const BitbucketConfig = require(process.env.CS_API_TOP + '/config/bitbucket');
const GlipConfig = require(process.env.CS_API_TOP + '/config/glip');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');
const Base64 = require('base-64');

class CommonInit {

	init (callback) {
		// since we're just doing a mock-up here, we won't actually have a valid refresh token anyway,
		// so we'll skip obtaining a token in the first place and just go through the motions
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
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
				this.redirectUri = `${ApiConfig.authOrigin}/provider-token/${this.provider}`;
				this.state = `${ApiConfig.callbackEnvironment}!${this.authCode}`;
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
		this.doApiRequest(
			{
				method: 'get',
				path: `/no-auth/provider-token/${this.provider}?code=${this.code}&state=${this.state}&_mockToken=${this.firstMockToken}`,
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
			},
			callback
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
				this.refreshToken = this.user.providerInfo[this.team.id][this.provider].refreshToken;
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
		return {
			teamId: this.team.id,
			refreshToken: this.refreshToken,
			_mockToken: this.refreshedMockToken
		};
	}

	getExpectedAsanaTestCallData () {
		const parameters = {
			grant_type: 'refresh_token',
			client_id: AsanaConfig.appClientId,
			client_secret: AsanaConfig.appClientSecret,
			refresh_token: this.refreshToken,
			redirect_uri: this.redirectUri
		};
		const url = 'https://app.asana.com/-/oauth_token';
		return { url, parameters };
	}

	getExpectedJiraTestCallData () {
		const parameters = {
			grant_type: 'refresh_token',
			client_id: JiraConfig.appClientId,
			client_secret: JiraConfig.appClientSecret,
			refresh_token: this.refreshToken,
			redirect_uri: this.redirectUri
		};
		const url = 'https://auth.atlassian.com/oauth/token';
		return { url, parameters };
	}

	getExpectedGitlabTestCallData () {
		const parameters = {
			redirect_uri: this.redirectUri,
			grant_type: 'refresh_token',
			client_id: GitlabConfig.appClientId,
			client_secret: GitlabConfig.appClientSecret,
			refresh_token: this.refreshToken
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `https://gitlab.com/oauth/token?${query}`;
		return { url, parameters };
	}

	getExpectedBitbucketTestCallData () {
		const parameters = {
			refresh_token: this.refreshToken,
			grant_type: 'refresh_token',
			redirect_uri: this.redirectUri
		};
		const userAuth = Base64.encode(`${BitbucketConfig.appClientId}:${BitbucketConfig.appClientSecret}`);
		const url = 'https://bitbucket.org/site/oauth2/access_token';
		return { url, parameters, userAuth };
	}

	getExpectedMSTeamsTestCallData () {
		const parameters = {
			refresh_token: this.refreshToken,
			grant_type: 'refresh_token',
			client_id: MSTeamsConfig.appClientId,
			client_secret: MSTeamsConfig.appClientSecret,
			redirect_uri: this.redirectUri
		};
		const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
		return { url, parameters };
	}

	getExpectedGlipTestCallData () {
		const parameters = {
			refresh_token: this.refreshToken,
			grant_type: 'refresh_token',
			client_id: GlipConfig.appClientId,
			client_secret: GlipConfig.appClientSecret,
			redirect_uri: this.redirectUri
		};
		const url = 'https://api.ringcentral.com/restapi/oauth/token';
		return { url, parameters };
	}
}

module.exports = CommonInit;
