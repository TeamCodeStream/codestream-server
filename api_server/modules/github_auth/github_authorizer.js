// provide a class to handle authorizing credentials for the github provider

'use strict';

const { Octokit } = require('@octokit/rest');
const RandomString = require('randomstring');
const ProviderErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/errors');

class GithubAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
		this.request.errorHandler.add(ProviderErrors);
	}

	// return identifying information associated with the fetched access token
	async getGithubIdentity (accessToken, providerInfo) {
		this.accessToken = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		this.octokit = new Octokit({ auth: accessToken });
		const userData = await this.githubApiRequest('users', 'getAuthenticated');
		let emailData = await this.githubApiRequest('users', 'listEmailsForAuthenticatedUser');
		this.request.log('user data: ' + JSON.stringify(userData, undefined, 5));
		this.request.log('email data: ' + JSON.stringify(emailData, undefined, 5));
		emailData = emailData instanceof Array ? emailData : null;
		if (!userData || !emailData) {
			throw this.request.errorHandler.error('noIdentityMatch');
		}

		const primaryEmail = emailData.find(e => e.primary);
		return {
			userId: userData.id,
			accessToken,
			username: userData.login,
			fullName: userData.name,
			email: primaryEmail ? primaryEmail.email : null,
			avatarUrl: userData.avatar_url
		};
	}

	// make a github api request
	async githubApiRequest(module, method) {
		if (this.accessToken === 'invalid-token') {	// for testing
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'invalid token' });
		}
		const mockCode = (
			this.providerInfo &&
			this.providerInfo.code && 
			this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
		);
		if (mockCode && mockCode.length >= 3) {
			if (method === 'getAuthenticated') {
				return this._mockIdentity(mockCode[1]);
			}
			else if (method === 'listEmailsForAuthenticatedUser') {
				return this._mockEmails();
			}
		}
		try {
			return (await this.octokit[module][method]()).data;
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	_mockIdentity (mockUserId) {
		return {
			id: mockUserId,
			login: RandomString.generate(8),
			name: `${RandomString.generate(8)} ${RandomString.generate(8)}`
		};
	}

	_mockEmails () {
		return [{
			primary: true,
			email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`
		}];
	}
}

module.exports = GithubAuthorizer;