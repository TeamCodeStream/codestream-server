// provide a class to handle authorizing credentials for the MS Teams provider

'use strict';

const RandomString = require('randomstring');
const Fetch = require('node-fetch');

class MSTeamsAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
	}

	// return identifying information associated with the fetched access token
	async getMSTeamsIdentity (accessToken, providerInfo) {
		this.token = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const userInfo = await this.graphApiRequest('/me');
		const orgInfo = await this.graphApiRequest('/organization?$select=id,displayName');
		if (!userInfo || !orgInfo || userInfo.error || orgInfo.error) {
			if (userInfo.error) {
				this.request.warn('Error obtaining user info', JSON.stringify(userInfo, undefined, 5));
			}
			else if (orgInfo.error) {
				this.request.warn('Error obtaining org info', JSON.stringify(orgInfo, undefined, 5));
			}
			throw this.request.errorHandler.error('noIdentityMatch');
		}
		this.request.log('userInfo: ' + JSON.stringify(userInfo, undefined, 5));
		this.request.log('orgInfo: ' + JSON.stringify(orgInfo, undefined, 5));
		return {
			userId: userInfo.id,
			teamId: orgInfo.value[0].id,
			teamName: orgInfo.value[0].displayName,
			accessToken,
			username: userInfo.displayName.toLowerCase().replace(/ /g, '_'),
			fullName: userInfo.displayName,
			email: userInfo.mail,
			phoneNumber: (userInfo.businessPhones && userInfo.businessPhones[0]) || '',
			iWorkOn: userInfo.jobTitle || ''
		};
	}

	async getMSTeamsJoinedTeams (accessToken, providerInfo) {
		this.token = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const teamInfo = await this.graphApiRequest('/me/joinedTeams?$select=id,displayName');
		if (!teamInfo || teamInfo.error) {
			if (teamInfo.error) {
				this.request.warn('Error obtaining team info', JSON.stringify(teamInfo, undefined, 5));
			}
			throw this.request.errorHandler.error('providerDataRequestFailed');
		}
		this.request.log('teamInfo: ' + JSON.stringify(teamInfo, undefined, 5));

		return {
			teams: teamInfo.value
		};
	}

	async getMSTeamsMeData (accessToken, providerInfo) {
		this.token = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const meInfo = await this.graphApiRequest('/me?$select=id');
		if (!meInfo || meInfo.error) {
			if (meInfo.error) {
				this.request.warn('Error obtaining meInfo', JSON.stringify(meInfo, undefined, 5));
			}
			throw this.request.errorHandler.error('providerDataRequestFailed');
		}
		this.request.log('meInfo: ' + JSON.stringify(meInfo, undefined, 5));

		return {
			me: meInfo
		};
	}

	// make an Graph API request
	async graphApiRequest (method) {
		if (this.token === 'invalid-token') { // for testing
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'invalid token' });
		}
		const mockCode = (
			this.providerInfo &&
			this.providerInfo.code &&
			this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
		);
		if (mockCode && mockCode.length >= 3) {
			if (method === '/me') {
				return this._mockUser(mockCode[1]);
			}
			else if (method.match(/^\/organization/)) {
				return this._mockOrganization(mockCode[2]);
			}
		}
		try {
			const response = await Fetch(
				`https://graph.microsoft.com/v1.0${method}`,
				{
					method: 'get',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${this.token}`
					}
				}
			);
			return await response.json();
		}
		catch (error) {
			this.request.warn('Request to Graph API failed: ' + error.message);
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error.message });
		}
	}

	_mockUser (mockUserId) {
		return {
			id: mockUserId,
			displayName: `${RandomString.generate(8)} ${RandomString.generate(8)}`,
			mail: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`,
			businessPhones: [Math.floor(Math.random() * 1000000000)],
			jobTitle: RandomString.generate(50)
		};
	}

	_mockOrganization (mockTeamId) {
		return {
			value: [{
				id: mockTeamId,
				displayName: RandomString.generate(10)
			}]
		};
	}
}

module.exports = MSTeamsAuthorizer;