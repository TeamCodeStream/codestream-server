'use strict';

const CodeStreamAPITest = require(process.env.CS_API_TOP + '/lib/test_base/codestream_api_test');
const BoundAsync = require(process.env.CS_API_TOP + '/server_utils/bound_async');
const Assert = require('assert');
const ApiConfig = require(process.env.CS_API_TOP + '/config/api');
const TrelloConfig = require(process.env.CS_API_TOP + '/config/trello');
const GithubConfig = require(process.env.CS_API_TOP + '/config/github');
const AsanaConfig = require(process.env.CS_API_TOP + '/config/asana');
const JiraConfig = require(process.env.CS_API_TOP + '/config/jira');
const GitlabConfig = require(process.env.CS_API_TOP + '/config/gitlab');
const BitbucketConfig = require(process.env.CS_API_TOP + '/config/bitbucket');

class ProviderAuthTest extends CodeStreamAPITest {

	constructor (options) {
		super(options);
		this.userOptions.numRegistered = 1;
		this.apiRequestOptions = {
			noJsonInResponse: true,
			expectRedirect: true
		};
	}

	get description () {
		return `should provide the appropriate redirect, when initiating an authorization flow to ${this.provider}`;
	}

	get method () {
		return 'get';
	}

	// before the test runs...
	before (callback) {
		BoundAsync.series(this, [
			super.before,
			this.getAuthCode
		], callback);
	}

	// get an auth-code for initiating the authorization flow
	getAuthCode (callback) {
		this.doApiRequest(
			{
				method: 'get',
				path: '/provider-auth-code?teamId=' + this.team.id,
				token: this.currentUser.accessToken
			},
			(error, response) => {
				if (error) { return callback(error); }
				this.authCode = response.code;
				this.path = `/no-auth/provider-auth/${this.provider}?code=${this.authCode}`;
				this.redirectUri = `${ApiConfig.authOrigin}/provider-token/${this.provider}`;
				this.state = `${ApiConfig.callbackEnvironment}!${this.authCode}`;
				callback();
			}
		);
	}

	validateResponse (data) {
		let redirectData;
		switch (this.provider) {
		case 'trello':
			redirectData = this.getTrelloRedirectData(); 
			break;
		case 'github':
			redirectData = this.getGithubRedirectData();
			break;
		case 'asana':
			redirectData = this.getAsanaRedirectData();
			break;
		case 'jira':
			redirectData = this.getJiraRedirectData();
			break;
		case 'gitlab':
			redirectData = this.getGitlabRedirectData();
			break;
		case 'bitbucket':
			redirectData = this.getBitbucketRedirectData();
			break;
		default:
			throw `unknown provider ${this.provider}`;
		}
		const { url, parameters } = redirectData;
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		const expectedUrl = `${url}?${query}`;
		Assert.equal(data, expectedUrl, `redirect url not correct for ${this.provider}`);
	}

	getTrelloRedirectData () {
		this.redirectUri += `?state=${this.state}`;
		const parameters = {
			expiration: 'never',
			name: 'CodeStream',
			scope: 'read,write',
			response_type: 'token',
			key: TrelloConfig.apiKey,
			callback_method: 'fragment',
			return_url: this.redirectUri
		};
		const url = 'https://trello.com/1/authorize';
		return { url, parameters };
	}

	getGithubRedirectData () {
		const parameters = {
			client_id: GithubConfig.appClientId,
			redirect_uri: this.redirectUri,
			scope: 'repo,user',
			state: this.state
		};
		const url = 'https://github.com/login/oauth/authorize';
		return { url, parameters };
	}

	getAsanaRedirectData () {
		const parameters = {
			client_id: AsanaConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state
		};
		const url = 'https://app.asana.com/-/oauth_authorize';
		return { url, parameters };
	}

	getJiraRedirectData () {
		const parameters = {
			audience: 'api.atlassian.com',
			client_id: JiraConfig.appClientId,
			scope: 'read:jira-user read:jira-work write:jira-work offline_access',
			redirect_uri: this.redirectUri,
			response_type: 'code',
			prompt: 'consent',
			state: this.state
		};
		const url = 'https://auth.atlassian.com/authorize';
		return { url, parameters };
	}

	getGitlabRedirectData () {
		const parameters = {
			client_id: GitlabConfig.appClientId,
			redirect_uri: `${this.redirectUri}?state=${this.state}`,
			state: this.state,
			response_type: 'token'
		};
		const url = 'https://gitlab.com/oauth/authorize';
		return { url, parameters };
	}

	getBitbucketRedirectData () {
		const parameters = {
			client_id: BitbucketConfig.appClientId,
			redirect_uri: this.redirectUri,
			scope: 'repository issue',
			state: this.state,
			response_type: 'code'
		};
		const url = 'https://bitbucket.org/site/oauth2/authorize';
		return { url, parameters };
	}
}

module.exports = ProviderAuthTest;
