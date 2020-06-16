// provide service to handle slack credential authorization

'use strict';

const Fetch = require('node-fetch');
const OAuthModule = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/oauth/oauth_module.js');
const SlackAuthorizer = require('./slack_authorizer');

const OAUTH_CONFIG = {
	provider: 'slack',
	host: 'slack.com',
	apiHost: 'slack.com/api',
	authPath: 'oauth/authorize',
	tokenPath: 'api/oauth.access',
	exchangeFormat: 'form',
	scopes: 'identify client',
	hasSharing: true
};

const STRICT_SCOPES = [
	'channels:history',
	'channels:read',
	'channels:write',
	'chat:write:user',
	'groups:history',
	'groups:read',
	'groups:write',
	'im:history',
	'im:read',
	'im:write',
	'users:read',
	'users:read.email',
	'users.profile:read',
	'reactions:write',
	'mpim:history',
	'mpim:read',
	'mpim:write'
];

const SHARING_SCOPES = [
	'channels:read',
	'chat:write:user',
	'groups:read',
	'im:read',
	'users:read',
	'users:read.email',
	'mpim:read'
];

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

	// overrides OAuthModule.getRedirectData to allow for "slack-lite", slack without the
	// scary "client" scope
	getRedirectData (options) {
		const data = super.getRedirectData(options);
		if (options.access === 'strict') {
			data.parameters.scope = STRICT_SCOPES.join(' ');
		} else if (options.sharing) {
			data.parameters.scope = SHARING_SCOPES.join(' ');
		}
		return data;
	}

	// overrides OAuthModule.getClientInfo to allow for "slack-lite", slack without the
	// scary "client" scope ... in this case, we use different client ID and secret
	getClientInfo (options) {
		const info = super.getClientInfo(options);
		if (options.access === 'strict') {
			info.clientId = this.apiConfig.appStrictClientId;
			info.clientSecret = this.apiConfig.appStrictClientSecret;
		} else if (options.sharing) {
			info.clientId = this.apiConfig.appSharingClientId;
			info.clientSecret = this.apiConfig.appSharingClientSecret;
		}
		return info;
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
