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
	async getMSTeamsIdentity (accessToken) {
		this.token = accessToken;
		const userInfo = await this.graphApiRequest('/me');
		const groupInfo = await this.graphApiRequest('/groups');
		if (!userInfo || !groupInfo) {
			throw this.request.errorHandler.error('noIdentityMatch');
		}
		this.request.log('userInfo: ' + JSON.stringify(userInfo, undefined, 5));
		this.request.log('groupInfo: ' + JSON.stringify(groupInfo, undefined, 5));
		return {
			userId: userInfo.id,
			teamId: groupInfo.value[0] ? groupInfo.value[0].id : null,	// FIXME ... we need a team picker
			teamName: groupInfo.value[0] ? groupInfo.value[0].displayName : null,
			accessToken,
			username: userInfo.displayName.toLowerCase().replace(/ /g, '_'),
			fullName: userInfo.displayName,
			email: userInfo.mail,
			phoneNumber: (userInfo.businessPhones && userInfo.businessPhones[0]) || '',
			iWorkOn: userInfo.jobTitle || ''
		};
	}

	// make an Graph API request
	async graphApiRequest(method) {
		const mockCode = (
			this.providerInfo &&
			this.providerInfo.code && 
			this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
		);
		if (mockCode && mockCode.length >= 3) {
			if (method === '/me') {
				return this._mockUser(mockCode[1]);
			}
			else if (method === '/groups') {
				return this._mockGroups(mockCode[2]);
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
			mail: /*this.providerInfo.mockEmail || */`${RandomString.generate(8)}@${RandomString.generate(8)}.com`,
			businessPhones: [Math.floor(Math.random() * 1000000000)],
			jobTitle: RandomString.generate(50)
		};
	}

	_mockGroups (mockTeamId) {
		return {
			values: [{
				id: mockTeamId,
				displayName: RandomString.generate(10)
			}]
		};
	}
}

module.exports = MSTeamsAuthorizer;