// provide a class to handle authorizing credentials for the bitbucket provider

'use strict';

const RandomString = require('randomstring');
const ProviderErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/errors');
const Fetch = require('node-fetch');

class BitbucketAuthorizer {

	constructor(options) {
		Object.assign(this, options);
		this.request = options.options.request;
		this.request.errorHandler.add(ProviderErrors);
	}

	// return identifying information associated with the fetched access token
	async getBitbucketIdentity(accessToken, providerInfo) {
		this.accessToken = accessToken;
		this.providerInfo = this.providerInfo || providerInfo;
		const userData = await this.bitbucketApiRequest('user');
		const emailData = await this.bitbucketApiRequest('user/emails');
		this.request.log('user data: ' + JSON.stringify(userData, undefined, 5));
		this.request.log('email data: ' + JSON.stringify(emailData, undefined, 5));
		if (!userData || !emailData) {
			throw this.request.errorHandler.error('noIdentityMatch');
		}

		const primaryEmail = emailData.values && emailData.values.find(_ => _.is_primary);
		if (!primaryEmail) {
			throw this.request.errorHandler.error('noIdentityMatch', { reason: 'no primary email found' });
		}

		return {
			userId: userData.uuid,
			accessToken,
			username: userData.username,
			fullName: userData.display_name,
			email: primaryEmail.email,
			avatarUrl: userData.links && userData.links.avatar && userData.links.avatar.href
		};
	}

	// make a bitbucket api request
	async bitbucketApiRequest(method) {
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
			else if (method === 'user/emails') {
				return this._mockEmailData();
			}
		}
		try {
			const response = await Fetch(
				`https://api.bitbucket.org/2.0/${method}`,
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
			uuid: mockUserId,
			username: RandomString.generate(8),
			display_name: `${RandomString.generate(8)} ${RandomString.generate(8)}`
		};
	}

	_mockEmailData() {
		return {
			values: [{
				is_primary: true,
				email: this.providerInfo.mockEmail || `${RandomString.generate(8)}@${RandomString.generate(8)}.com`
			}]
		};
	}
}

module.exports = BitbucketAuthorizer;