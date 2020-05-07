// provide a class to handle authorizing credentials for the okta provider

'use strict';

const RandomString = require('randomstring');
const ProviderErrors = require(process.env.CS_API_TOP + '/modules/providers/errors');
const Fetch = require('node-fetch');

class OktaAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
		this.request.errorHandler.add(ProviderErrors);
	}

	// return identifying information associated with the fetched access token
	async getOktaIdentity (accessToken, providerInfo) {
		this.accessToken = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const subDomain = this.options.orgId ? `${this.options.orgId}.` : '';
		const response = await Fetch(
			`https://${subDomain}${this.options.config.apiHost}/oauth2/v1/userinfo`,
			{ 
				headers: {
					Accept: 'application/json',
					'Content-type': 'application/json',
					Authorization: `Bearer ${accessToken}`
				}
			}
		);
		if (!response.ok) {
			const error = `Bad response from Okta server (${response.status}): ${response.headers.get('www-authenticate')}`;
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error });
		}
		const userData = await response.json();
		this.request.log('user data: ' + JSON.stringify(userData, undefined, 5));
		const username = (userData.preferred_username || '').split('@')[0];
		return {
			userId: userData.sub,
			accessToken,
			username,
			fullName: userData.name,
			email: userData.email,
			timeZone: userData.zoneinfo,
			phoneNumber: userData.phone_number,
			orgId: this.options.orgId
		};
	}

	// fetch user info from okta
	async fetchUserInfo() {
		if (this.accessToken === 'invalid-token') {	// for testing
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: 'invalid token' });
		}
		const mockCode = (
			this.providerInfo &&
			this.providerInfo.code && 
			this.providerInfo.code.match(/^mock.*-(.+)-(.+)$/)
		);
		if (mockCode && mockCode.length >= 3) {
			return this._mockIdentity(mockCode[1]);
		}

		const response = await Fetch(
			`${this.options.config.apiHost}/oauth2/v1/userinfo`,
			{ 
				headers: {
					Accept: 'application/json',
					'Content-type': 'application/json',
					Authorization: `Bearer ${this.accessToken}`
				}
			}
		);
		if (!response.ok) {
			const error = `Bad response from Okta server (${response.status}): ${response.headers.get('www-authenticate')}`;
			throw this.request.errorHandler.error('invalidProviderCredentials', { reason: error });
		}
		return await response.json();
	}

	_mockIdentity (mockUserId) {
		return {
			sub: mockUserId,
			preferred_username: RandomString.generate(8),
			name: `${RandomString.generate(8)} ${RandomString.generate(8)}`,
			email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`
		};
	}
}

module.exports = OktaAuthorizer;