// provide a class to handle authorizing credentials for the slack provider

'use strict';

const { WebClient } = require('@slack/client');
const RandomString = require('randomstring');

class ProviderInfoAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
	}

	// authorize the provider info by getting the slack access token, and verifying it it is a valid token
	// using the slack API
	async authorize () {
		if (!this.providerInfo.authToken) {
			throw this.request.errorHandler.error('parameterRequired', { info: 'providerInfo.authToken' });
		}
		
		// connect to slack and find the slack user associated with the given token
		this.webClient = await this.getSlackWebClient(this.providerInfo.authToken);

		// N.B. i hope we can deprecate this and instead call users.identity to get the identity associated
		// with the token 
		if (!this.providerInfo.userId) {
			throw this.request.errorHandler.error('parameterRequired', { info: 'providerInfo.userId' });
		}
		const user = await this.findSlackUser(this.providerInfo.userId);
		const team = await this.getSlackTeamInfo();

		// return identity info
		return {
			userId: user.id,
			teamId: user.team_id,
			teamName: team.name,
			authToken: this.providerInfo.authToken,
			username: user.name,
			fullName: user.real_name,
			timeZone: user.tz,
			email: user.profile.email
		};
	}

	async getSlackWebClient (token) {
		try {
			return new WebClient(token);
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	async findSlackUser (userId) {
		const info = await this.slackApiRequest('users.list');
		if (
			typeof info !== 'object' ||
			!(info.members instanceof Array)
		) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'improper user list returned' });
		}
		const user = info.members.find(entry => entry.id === userId);
		if (!user) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'could not find given user among team members' });
		}
		return user;
	}

	async getSlackTeamInfo () {
		const info = await this.slackApiRequest('team.info');
		if (
			typeof info !== 'object' ||
			typeof info.team !== 'object'
		) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'improper team info returned' });
		}
		return info.team;
	}

	async slackApiRequest(method, options = {}) {
		const mockToken = this.providerInfo.authToken.match(/^mock.*-(.+)-(.+)$/);
		if (mockToken && mockToken.length >= 3) {
			if (method === 'users.list') {
				return this._mockUsers(mockToken[1], mockToken[2]);
			}
			else if (method === 'team.info') {
				return this._mockTeam();
			}
		}
		try {
			return await this.webClient.apiCall(method, options);
		}
		catch (error) {
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	_mockUsers (mockUserId, mockTeamId) {
		return {
			members: [{
				id: mockUserId,
				team_id: mockTeamId,
				name: RandomString.generate(8),
				real_name: `${RandomString.generate(8)} ${RandomString.generate(8)}`,
				tz: 'America/New_York',
				profile: {
					email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`
				}
			}]
		};
	}

	_mockTeam () {
		return {
			team: {
				name: RandomString.generate(8)
			}
		};
	}
}

module.exports = ProviderInfoAuthorizer;