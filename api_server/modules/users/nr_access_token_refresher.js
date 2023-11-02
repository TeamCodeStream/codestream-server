const UserIndexes = require('./indexes');
const NewRelicIDPConstants = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/newrelic_idp_constants');

module.exports = async (options) => {
	const { tokenInfo, request, loginType = 'web', force = false } = options;
	tokenInfo.provider = tokenInfo.provider || NewRelicIDPConstants.NR_AZURE_LOGIN_POLICY;
	const { refreshToken, expiresAt, provider } = tokenInfo;
	const mockResponse = !!request.request.headers['x-cs-no-newrelic'];

	if (!refreshToken) {
		request.log('Cannot refresh New Relic issued access token, no refresh token is available');
		return;
	}
	if (!force && !expiresAt) {
		request.log('Cannot refresh New Relic issued access token, no expiration was given');
		return;
	}
	if (!provider) {
		request.log('Cannot refresh New Relic issued access token, no provider was given');
		return;
	}

	if (!force && expiresAt >= Date.now() + 60 * 1000) {
		return;
	}

	request.log('User\'s New Relic issued access token is expired, attempting to refresh...');
	const newTokenInfo = await request.api.services.idp.customRefreshToken(tokenInfo, { request, mockResponse });
	request.log('User\'s New Relic issued access token was successfully refreshed');

	// if we are behind service gateway and using login service auth, we actually set the user's
	// access token to the refreshed NR access token, this will be used for normal requests
	const userSet = {};
	if (request.request.serviceGatewayAuth) {
		userSet[`accessTokens.${loginType}.token`] = newTokenInfo.accessToken;
		userSet[`accessTokens.${loginType}.refreshToken`] = newTokenInfo.refreshToken;
		userSet[`accessTokens.${loginType}.expiresAt`] = newTokenInfo.expiresAt;
		userSet[`accessTokens.${loginType}.provider`] = newTokenInfo.provider || provider;
	}
	
	let user = request.user;
	if (!user) {
		const identity = await request.api.services.idp.getUserIdentity({ accessToken: newTokenInfo.accessToken, request, mockResponse });
		user = await request.data.users.getOneByQuery(
			{
				nrUserId: identity.nrUserId,
				deactivated: false
			},
			{
				hint: UserIndexes.byNRUserId
			}
		);
		if (!user) {
			throw request.errorHandler.error('notFound', { info: 'user' });
		}
	}

	const teamId = (user.get('teamIds') || [])[0];
	if (teamId) {
		userSet[`providerInfo.${teamId}.newrelic.accessToken`] = newTokenInfo.accessToken;
		userSet[`providerInfo.${teamId}.newrelic.refreshToken`] = newTokenInfo.refreshToken;
		userSet[`providerInfo.${teamId}.newrelic.expiresAt`] = newTokenInfo.expiresAt;
		userSet[`providerInfo.${teamId}.newrelic.provider`] = newTokenInfo.provider || provider;
	}

	return { newTokenInfo, userSet, user };
};

