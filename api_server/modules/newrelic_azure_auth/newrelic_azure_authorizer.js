// provide a class to handle authorizing credentials for the github provider

'use strict';

const JWT = require('jsonwebtoken');

class NewRelicAzureAuthorizer {

	constructor (options) {
		Object.assign(this, options);
		this.request = options.options.request;
	}

	// return identifying information associated with the fetched access token
	async getNewRelicAzureIdentity (accessToken, providerInfo) {
		const payload = JWT.decode(accessToken);
		const email = payload.emails ? payload.emails[0] : null;

		// look for a github login, and set up making that a PAT for the user
		let __subIDP;
		if (payload.idp === 'github.com' && payload.idp_access_token) {
			__subIDP = {
				name: 'github',
				accessToken: payload.idp_access_token
			};
		}

		return {
			userId: payload.oid,
			accessToken,
			fullName: payload.name,
			email,
			__subIDP
		};
	}
}

module.exports = NewRelicAzureAuthorizer;