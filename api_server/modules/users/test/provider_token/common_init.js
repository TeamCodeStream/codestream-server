// base class for many tests of the "GET /no-auth/provider-token" requests

'use strict';

const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const RandomString = require('randomstring');
const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const GithubConfig = require(process.env.CS_API_TOP + '/config/github');
const GithubEnterpriseConfig = require(process.env.CS_API_TOP + '/config/github_enterprise');
const AsanaConfig = require(process.env.CS_API_TOP + '/config/asana');
const JiraConfig = require(process.env.CS_API_TOP + '/config/jira');
const GitlabConfig = require(process.env.CS_API_TOP + '/config/gitlab');
const BitbucketConfig = require(process.env.CS_API_TOP + '/config/bitbucket');
const SlackConfig = require(process.env.CS_API_TOP + '/config/slack');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');
const GlipConfig = require(process.env.CS_API_TOP + '/config/glip');
const Base64 = require('base-64');

const ENTERPRISE_PROVIDERS = [
	'github-enterprise'
];

class CommonInit {

	init (callback) {
		// get an auth-code and set the token, the test itself is verifying the token has been set in the user object
		BoundAsync.series(this, [
			this.setTestOptions,
			CodeStreamAPITest.prototype.before.bind(this),
			this.getAuthCode,	// get an auth-code to use in the provider-token request
			this.setProviderToken	// make the provider-token request
		], callback);
	}

	setTestOptions (callback) {
		this.userOptions.numRegistered = 1;
		callback();
	}

	// get an auth-code for initiating the authorization flow
	getAuthCode (callback) {
		let path = '/provider-auth-code?teamId=' + this.team.id;
		if (this.expiresIn) {
			path += '&expiresIn=' + this.expiresIn;
		}
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
				if (ENTERPRISE_PROVIDERS.includes(this.provider)) {
					this.appOrigin = `https://${this.provider}.codestream.us`;
					if (!this.excludeAppOrigin) {
						this.state += `!${this.appOrigin}`;
					}
				}
				callback();
			}
		);
	}

	// make the provider-token request to set the user's access token for the given provider,
	// the actual test is fetching the user object and verifying the token has been set
	// note that this is a mock test, there is no actual call made to the provider
	setProviderToken (callback) {
		this.code = RandomString.generate(16);
		this.mockToken = RandomString.generate(16);
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
				requestOptions: {
					noJsonInResponse: true,
					expectRedirect: true
				}
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
			redirect_uri: this.redirectUri,
			client_id: GithubConfig.appClientId,
			client_secret: GithubConfig.appClientSecret,
			code: this.code,
			state: this.state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `https://github.com/login/oauth/access_token?${query}`;
		return { url, parameters };
	}

	getExpectedGithubEnterpriseTestCallData () {
		const parameters = {
			redirect_uri: this.redirectUri,
			client_id: GithubEnterpriseConfig.appClientId,
			client_secret: GithubEnterpriseConfig.appClientSecret,
			code: this.code,
			state: this.state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `${this.appOrigin}/login/oauth/access_token?${query}`;
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
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const url = 'https://auth.atlassian.com/oauth/token';
		return { url, parameters };
	}

	getExpectedGitlabTestCallData () {
		const parameters = {
			redirect_uri: this.redirectUri,
			grant_type: 'authorization_code',
			client_id: GitlabConfig.appClientId,
			client_secret: GitlabConfig.appClientSecret,
			code: this.code,
			state: this.state
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const url = `https://gitlab.com/oauth/token?${query}`;
		return { url, parameters };
	}

	getExpectedBitbucketTestCallData () {
		const parameters = {
			code: this.code,
			grant_type: 'authorization_code',
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const userAuth = Base64.encode(`${BitbucketConfig.appClientId}:${BitbucketConfig.appClientSecret}`);
		const url = 'https://bitbucket.org/site/oauth2/access_token';
		return { url, parameters, userAuth };
	}

	getExpectedSlackTestCallData () {
		const parameters = {
			code: this.code,
			grant_type: 'authorization_code',
			client_id: SlackConfig.appClientId,
			client_secret: SlackConfig.appClientSecret,
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const url = 'https://slack.com/api/oauth.access';
		return { url, parameters  };
	}

	getExpectedMSTeamsTestCallData () {
		const parameters = {
			code: this.code,
			grant_type: 'authorization_code',
			client_id: MSTeamsConfig.appClientId,
			client_secret: MSTeamsConfig.appClientSecret,
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
		return { url, parameters  };
	}

	getExpectedGlipTestCallData () {
		const parameters = {
			code: this.code,
			grant_type: 'authorization_code',
			client_id: GlipConfig.appClientId,
			client_secret: GlipConfig.appClientSecret,
			redirect_uri: this.redirectUri,
			state: this.state
		};
		const url = 'https://api.ringcentral.com/restapi/oauth/token';
		return { url, parameters  };
	}
}

module.exports = CommonInit;
