// provide a class to handle authorizing credentials for the github provider

'use strict';

const JWT = require('jsonwebtoken');
const BitbucketAuthorizer = require('../bitbucket_auth/bitbucket_authorizer');

class NewRelicAzureAuthorizer {
	constructor(options) {
		Object.assign(this, options);
		this.request = options.options.request;
	}

	// return identifying information associated with the fetched access token
	async getNewRelicAzureIdentity(accessToken, providerInfo) {
		const payload = JWT.decode(accessToken);
		let email = payload.emails ? payload.emails[0] : payload.email || null;

		// look for a github login, and set up making that a PAT for the user
		let __subIDP;
		const knownIDPs = ['github.com', 'gitlab.com', 'bitbucket.org'];
		const idp = knownIDPs.find((idp) => idp === payload.idp);
		if (idp && payload.idp_access_token) {
			__subIDP = {
				name: idp.split('.')[0],
				accessToken: payload.idp_access_token,
				userId: payload.oid,
			};
		}

		const __topLevelAttributes = {
			nrAzureUserId: payload.sub,
		};

		// for bitbucket, sadly, we don't get the email in the user profile data,
		// we have to go explicitly get it
		if (payload.idp === 'bitbucket.org' && !email && payload.idp_access_token) {
			email = await BitbucketAuthorizer.getUserEmail(payload.idp_access_token);
		}

		return {
			userId: payload.sub,
			accessToken,
			fullName: payload.name,
			email,
			__subIDP,
			__topLevelAttributes,
		};
	}
}

module.exports = NewRelicAzureAuthorizer;
