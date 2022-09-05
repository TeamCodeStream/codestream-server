// provide service to handle slack credential authorization

'use strict';

const Fetch = require('node-fetch');
const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const SlackAuthorizer = require('./slack_authorizer');

const USER_SCOPES = [
	'channels:read',
	'channels:write',
	'chat:write',
	'groups:read',
	'groups:write',
	'im:read',
	'mpim:read',
	'mpim:write',
	'users.profile:write',
	'users:read',
	'users:read.email'
];

const BOT_SCOPES = [
	'channels:history',
	'channels:read',
	'chat:write',
	'groups:history',
	'groups:read',
	'mpim:history',
	'mpim:read',
	'users:read',
	'users:read.email'
];

const OAUTH_CONFIG = {
	provider: 'slack',
	host: 'slack.com',
	apiHost: 'slack.com/api',
	authPath: 'oauth/v2/authorize',
	tokenPath: 'api/oauth.v2.access',
	exchangeFormat: 'form',
	scopes: USER_SCOPES.join(' '),
	hasSharing: true,
	scopeParameter: 'user_scope',
	hasServerToken: true,
	botScopeParameter: 'scope',
	botScopes: BOT_SCOPES.join(' ')
};


class SlackAuth extends OAuthModule {
	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	async authorizeProviderInfo (providerInfo, options) {
		return await new SlackAuthorizer({
			providerInfo,
			options
		}).exchangeAndAuthorize();
	}

	getRedirectData (options) {
		const { url, parameters } = super.getRedirectData(options);
		if (options.requestServerToken) {
			const { botScopes, botScopeParameter } = this.oauthConfig;
			parameters[botScopeParameter] = botScopes;
		}
		return { url, parameters };
	}

	// overrides OAuthModule.getClientInfo to use "sharing model" app
	getClientInfo(options) {
		const info = super.getClientInfo(options);
		info.clientId = this.apiConfig.appClientId;
		info.clientSecret = this.apiConfig.appClientSecret; 
		return info;
	}

	// overrides OAuthModule.normalizeTokenDataResponse, to get the buried access token and other info
	// since Slack updated their OAuth API to v2, we're trying to make this look like the data we got back from V1,
	// so we don't have to do a client update ... see https://api.slack.com/authentication/migration
	normalizeTokenDataResponse (responseData) {
		let serverToken;
		if (responseData.access_token) {
			serverToken = {
				access_token: responseData.access_token,
				scope: responseData.scope
			};
		}
		responseData.access_token = (responseData.authed_user || {}).access_token;
		responseData.user_id = (responseData.authed_user || {}).id;
		responseData.team_id = (responseData.team || {}).id;
		responseData.team_name = (responseData.team || {}).name;
		responseData.scope = (responseData.authed_user || {}).scope;
		if (serverToken) {
			serverToken = {
				...responseData,
				...serverToken
			};
			delete serverToken.user_id;
			delete serverToken.authed_user;
			delete responseData.bot_user_id;
			delete responseData.token_type;
			const userToken = super.normalizeTokenDataResponse(responseData);
			serverToken = super.normalizeTokenDataResponse(serverToken);
			return { userToken, serverToken };
		}
		return super.normalizeTokenDataResponse(responseData);
	}

	validateChannelName (name) {
		if (name.match(/[^a-z0-9-_[\]{}\\/]/)) {
			return 'illegal characters in channel name';
		}
		if (name.length > 21) {
			return 'name must be no longer than 21 characters';
		}
	}

	// match the given slack identity to a CodeStream identity
	async getUserIdentity (options) {
		const authorizer = new SlackAuthorizer({ options });
		return await authorizer.getSlackIdentity(
			options.accessToken,
			options.providerInfo
		);
	}

	async getServerTokenMultiAuthKey (info) {
		return info.data.team_id;
	}

	// an access token can be maintained for each slack workspace
	async getMultiAuthExtraData (info, options) {
		const data = {};
		try {
			const request = await Fetch(
				`https://slack.com/api/users.info?user=${info.data.user_id}&include_locale=true`,
				{
					method: 'get',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${info.accessToken}`
					}
				}
			);

			const response = await request.json();
			if (!response.ok) {
				options.request.warn('Error obtaining slack user info', response.error);
				throw options.request.errorHandler.error('providerDataRequestFailed');
			}

			data[info.data.team_id] = {
				locale: response.user.locale,
				tz: response.user.tz,
				tz_label: response.user.tz_label
			};
		}
		catch (error) {
			options.request.warn('Request to Slack API failed: ' + error.message);
			throw error;
		}

		return data;
	}

	async getUserId(info) {
		return info && info.data ? info.data.user_id : undefined;
	}
}

module.exports = SlackAuth;
