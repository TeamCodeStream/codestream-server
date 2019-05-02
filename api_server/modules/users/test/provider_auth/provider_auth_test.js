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
const YouTrackConfig = require(process.env.CS_API_TOP + '/config/youtrack');
const AzureDevOpsConfig = require(process.env.CS_API_TOP + '/config/azuredevops');

const SlackConfig = require(process.env.CS_API_TOP + '/config/slack');
const MSTeamsConfig = require(process.env.CS_API_TOP + '/config/msteams');
const GlipConfig = require(process.env.CS_API_TOP + '/config/glip');
//const GithubEnterpriseConfig = require(process.env.CS_API_TOP + '/etc/githubEnterprise');

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
		let description = `should provide the appropriate redirect, when initiating an authorization flow to ${this.provider}`;
		if (this.testHost) {
			description += ', enterprise version';
		}
		return description;
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
				if (this.testHost) {
					this.path += `&host=${this.testHost}`;
					this.state += `!${this.testHost}`;
				}
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
		case 'youtrack':
			redirectData = this.getYouTrackRedirectData();
			break;
		case 'azuredevops':
			redirectData = this.getAzureDevOpsRedirectData();
			break;
		case 'slack':
			redirectData = this.getSlackRedirectData();
			break;
		case 'msteams':
			redirectData = this.getMSTeamsRedirectData();
			break;
		case 'glip':
			redirectData = this.getGlipRedirectData();
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
			response_type: 'token',
			scope: 'read,write',
			expiration: 'never',
			name: 'CodeStream',
			callback_method: 'fragment',
			return_url: this.redirectUri,
			key: TrelloConfig.apiKey
		};
		const url = 'https://trello.com/1/authorize';
		return { url, parameters };
	}

	getGithubRedirectData () {
		const appClientId = this.testHost ?
			''/*GithubEnterpriseConfig[this.testHost].appClientId*/ :
			GithubConfig.appClientId;
		const parameters = {
			client_id: appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'repo,user'
		};
		const host = this.testHost || 'github.com';
		const url = `https://${host}/login/oauth/authorize`;
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
			client_id: JiraConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'read:jira-user read:jira-work write:jira-work offline_access',
			audience: 'api.atlassian.com',
			prompt: 'consent',
		};
		const url = 'https://auth.atlassian.com/authorize';
		return { url, parameters };
	}

	getGitlabRedirectData () {
		const parameters = {
			client_id: GitlabConfig.appClientId,
			redirect_uri: `${this.redirectUri}`,
			response_type: 'code',
			state: this.state
		};
		const url = 'https://gitlab.com/oauth/authorize';
		return { url, parameters };
	}

	getBitbucketRedirectData () {
		const parameters = {
			client_id: BitbucketConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'account team repository issue:write'
		};
		const url = 'https://bitbucket.org/site/oauth2/authorize';
		return { url, parameters };
	}

	getYouTrackRedirectData () {
		const parameters = {
			client_id: YouTrackConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'token',
			state: this.state,
			scope: 'YouTrack',
			request_credentials: 'default'
		};
		const url = 'https://youtrack.com/api/rest/oauth2/auth';
		return { url, parameters };
	}

	getAzureDevOpsRedirectData () {
		const parameters = {
			client_id: AzureDevOpsConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'Assertion',
			state: this.state,
			scope: 'vso.identity vso.work_write',
			client_assertion_type: 'urn:ietf:params:oauth:client-assertion-type:jwt-bearer',
			grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer'
		};
		const url = 'https://youtrack.com/api/rest/oauth2/auth';
		return { url, parameters };
	}

	getSlackRedirectData () {
		const parameters = {
			client_id: SlackConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'identify client'
		};
		const url = 'https://slack.com/oauth/authorize';
		return { url, parameters };
	}

	getMSTeamsRedirectData () {
		const parameters = {
			client_id: MSTeamsConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state,
			scope: 'https://graph.microsoft.com/mail.read offline_access',
			response_mode: 'query',
			prompt: 'consent'
		};
		const url = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
		return { url, parameters };
	}

	getGlipRedirectData () {
		const parameters = {
			client_id: GlipConfig.appClientId,
			redirect_uri: this.redirectUri,
			response_type: 'code',
			state: this.state
		};
		const url = 'https://api.ringcentral.com/restapi/oauth/authorize';
		return { url, parameters };
	}
}

module.exports = ProviderAuthTest;
