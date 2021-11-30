// provide a class to handle authorizing credentials for the gitlab provider

'use strict';

const RandomString = require('randomstring');
const ProviderErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/errors');
const Fetch = require('node-fetch');

class GitlabAuthorizer {

	constructor(options) {
		Object.assign(this, options);
		this.request = options.options.request;
		this.request.errorHandler.add(ProviderErrors);
	}

	// return identifying information associated with the fetched access token
	async getGitlabIdentity(accessToken, providerInfo) {
		this.accessToken = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const userData = await this.gitlabApiRequest('user');
		const emailData = await this.gitlabApiRequest(`users/${userData.id}`);
		this.request.log('user data: ' + JSON.stringify(userData, undefined, 5));
		this.request.log('email data: ' + JSON.stringify(emailData, undefined, 5));
		if (!userData || !emailData) {
			throw this.request.errorHandler.error('noIdentityMatch');
		}

		const email = emailData.public_email || emailData.email;
		if (!email) {
			throw this.request.errorHandler.error('gitlabPublicEmail');
		}

		return {
			userId: userData.id,
			accessToken,
			username: userData.username,
			fullName: userData.name,
			email,
			avatarUrl: userData.avatar_url
		};
	}

	// make a gitlab api request
	async gitlabApiRequest(method) {
		if (this.accessToken === 'invalid-token') {	// for testing
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'invalid token' });
		}
		const mockCode = (
			this.providerInfo &&
			this.providerInfo.code &&
			this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
		);
		if (mockCode && mockCode.length >= 3) {
			if (method === 'user') {
				return this._mockIdentity(mockCode[1]);
			}
			else if (method.startsWith('users/')) {
				return this._mockEmailData();
			}
		}
		try {
			const response = await Fetch(
				`https://gitlab.com/api/v4/${method}`,
				{
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${this.accessToken}`
					}
				}
			);
			return await response.json();
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	_mockIdentity(mockUserId) {
		return {
			id: mockUserId,
			username: RandomString.generate(8),
			name: `${RandomString.generate(8)} ${RandomString.generate(8)}`
		};
	}

	_mockEmailData() {
		return {
			public_email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`
		};
	}
}

module.exports = GitlabAuthorizer;