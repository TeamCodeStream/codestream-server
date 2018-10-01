// provide a class to handle authorizing credentials for the slack provider

'use strict';

const { WebClient } = require('@slack/client');
const RandomString = require('randomstring');

class ProviderInfoAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
		this.webClient = new WebClient();
	}

	// given an authorization code from slack, exchange it for an access token and then get info 
	// about the user, returning all to the caller
	async exchangeAndAuthorize () {
		if (!this.providerInfo.code) {
			throw this.request.errorHandler.error('parameterRequired', { info: 'providerInfo.code' });
		}
		if (!this.providerInfo.redirectUri) {
			throw this.request.errorHandler.error('parameterRequired', { info: 'providerInfo.redirectUri' });
		}

		// connect to slack exchange the auth code for an access token
		this.accessToken = await this.exchangeCodeForAccessToken();

		this.webClient = new WebClient(this.accessToken);
		const identityInfo = await this.slackApiRequest('auth.test');
		const userInfo = await this.slackApiRequest('users.info', { user: identityInfo.user_id });
		return {
			userId: identityInfo.user_id,
			teamId: identityInfo.team_id,
			teamName: identityInfo.team,
			accessToken: this.accessToken,
			username: identityInfo.user,
			fullName: userInfo.user.profile.real_name,
			email: userInfo.user.profile.email,
			phoneNumber: userInfo.user.profile.phone,
			iWorkOn: userInfo.user.profile.title,
			timeZone: userInfo.user.tz
		};
	}

	// exchange the given temporary authorization code for an access token
	async exchangeCodeForAccessToken () {
		if (this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)) {
			return RandomString.generate(50);
		}
		let result;
		try {
			result = await this.webClient.oauth.access({
				client_id: this.request.api.config.slack.appClientId,
				client_secret: this.request.api.config.slack.appClientSecret,
				redirect_uri: this.providerInfo.redirectUri,
				code: this.providerInfo.code
			});
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
		return result.access_token;
	}

	// make a slack request
	async slackApiRequest(method, options = {}) {
		const mockCode = this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/);
		if (mockCode && mockCode.length >= 3) {
			if (method === 'auth.test') {
				return this._mockIdentity(mockCode[1], mockCode[2]);
			}
			else if (method === 'users.info') {
				return this._mockUser();
			}
		}
		try {
			return await this.webClient.apiCall(method, options);
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	_mockIdentity (mockUserId, mockTeamId) {
		return {
			user_id: mockUserId,
			team_id: mockTeamId,
			team: RandomString.generate(8),
			user: RandomString.generate(8)
		};
	}

	_mockUser () {
		return {
			user: {
				tz: 'America/New_York',
				profile: {
					email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`,
					real_name: `${RandomString.generate(8)} ${RandomString.generate(8)}`,
					phone: '' + Math.floor(Math.random() * 1000000000),
					title: RandomString.generate(50)
				}
			}
		};
	}
}

module.exports = ProviderInfoAuthorizer;