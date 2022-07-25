// handle the "GET /bcast-token" request to fetch the user's broadcaster token
// if the token has changed permissions, a new token will be generated

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const UserSubscriptionGranter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_subscription_granter.js');

class GetBroadcasterTokenRequest extends RestfulRequest {

	async authorize () {
		// no authorization necessary, always applies to current user
	}

	// process the request...
	async process () {
		// obtain a V3 PubNub Access Manager issued token, which may involve generating a new one
		let tokenData;
		try {
			tokenData = await new UserSubscriptionGranter({
				api: this.api,
				user: this.user,
				request: this,
				force: this.request.query.force
			}).obtainV3BroadcasterToken();
		}
		catch (error) {
			throw this.errorHandler.error('userMessagingGrant', { reason: error });
		}

		this.responseData = { token: tokenData.token };
	}
}

module.exports = GetBroadcasterTokenRequest;
