// handle the "POST /provider-request" request to obtain a new access token given a refresh token 

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');

class ProviderRefreshRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
	}

	async authorize () {
		// user must be a member of the team
		this.teamId = this.request.query.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('readAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		// get the provider service corresponding to the passed provider
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.getTeam();			// get the team the user is auth'd with
		await this.getExistingProviderInfo(); // get providerInfo for this provider
		await this.fetchAccessToken();	// fetch the access token from the third-party provider
		await this.saveToken();			// save the access token for the user
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['teamId']
				},
				optional: {
					string: ['_mockToken', '_mockRefreshToken', 'host', 'sharing', 'subId']
				}
			}
		);
		this.sharing = this.request.query.sharing;
		this.subId = this.request.query.subId;
	}

	// get the team the user is authed with
	async getTeam () {
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	async getExistingProviderInfo () {
		if (this.request.query.host) {
			this.host = decodeURIComponent(this.request.query.host).toLowerCase();
		}
		let providerInfoKey, existingProviderInfo;
		const providerInfo = this.user.get('providerInfo') || {};
		if (
			providerInfo[this.provider] &&
			providerInfo[this.provider].accessToken
		) {
			providerInfoKey = `providerInfo.${this.provider}`;
			existingProviderInfo = providerInfo[this.provider];
		} else {
			providerInfoKey = `providerInfo.${this.team.id}.${this.provider}`;
			if (this.host) {
				const starredHost = this.host.replace(/\./g, '*');
				providerInfoKey += `.hosts.${starredHost}`;
				existingProviderInfo = (providerInfo[this.teamId][this.provider].hosts || {})[starredHost] || {};
			} else {
				existingProviderInfo = providerInfo[this.teamId][this.provider];
			}
		}
		this.existingProviderInfo = existingProviderInfo;
		this.providerInfoKey = providerInfoKey;
	}

	// perform an exchange of auth code for access token, as needed
	async fetchAccessToken () {
		if (!this.serviceAuth.supportsRefresh()) {
			throw this.errorHandler.error('readAuth', { reason: 'token refresh not supported by provider' });
		}
		const { authOrigin } = this.api.config.apiServer;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;

		const refreshToken = this.request.query._mockRefreshToken ?
			this.request.query._mockRefreshToken :
			this.existingProviderInfo.refreshToken;

		if (!refreshToken) {
			throw this.errorHandler.error('readAuth', { info: { message: "Missing auth info" } });
		}

		const options = {
			refreshToken: refreshToken,
			provider: this.provider,
			redirectUri,
			request: this,
			mockToken: this.request.query._mockToken,
			team: this.team,
			host: this.host
		};
		try {
			this.tokenData = await this.serviceAuth.refreshToken(options);
		}
		catch (error) {
			throw this.errorHandler.error('readAuth', { info: error });
		}
		this.tokenData.refreshToken = this.tokenData.refreshToken || this.refreshToken;
	}

	// save the provided token for the user
	async saveToken () {
		if (!this.tokenData || !this.tokenData.accessToken) {
			throw this.errorHandler.error('readAuth', { reason: 'token not returned from provider' });
		}

		// if the user has credentials above the team level (as in, they used the provider for sign-in),
		// ignore the team parameter and set the data at that level

		const modifiedAt = Date.now();
		let op;
		if (this.sharing) {
			if (!this.subId)
				throw this.errorHandler.error('parameterRequired', { info: 'subId' });

			op = { $set: {} };
			const existingData = (this.existingProviderInfo.multiple || {})[this.subId];
			const extra = existingData && existingData.extra;
			op.$set[`${this.providerInfoKey}.multiple.${this.subId}`] = { ...this.tokenData, extra: extra };
			op.$set.modifiedAt = modifiedAt;
		}
		else {
			const newProviderInfo = Object.assign({}, this.existingProviderInfo, this.tokenData);
			op = {
				$set: {
					[this.providerInfoKey]: newProviderInfo,
					modifiedAt
				}
			};
		}

		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// handle the response to the request
	async handleResponse () {
		// the response will be the user update, with an update of the token data
		if (this.gotError) {
			return super.handleResponse();
		}
		this.responseData = { user: this.transforms.userUpdate };
		await super.handleResponse();
	}

	// after a response is returned....
	async postProcess () {
		if (!this.user) { return; }
		await this.publishUserToSelf();
	}

	// publish updated user to themselves, to propagate the new token
	async publishUserToSelf () {
		const data = {
			user: Object.assign(
				{
					id: this.user.id
				},
				this.transforms.userUpdate
			),
			requestId: this.request.id
		};
		const channel = `user-${this.user.id}`;
		try {
			await this.api.services.broadcaster.publish(
				data,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish user update to user ${this.user.id}: ${JSON.stringify(error)}`);
		}
	}


	// describe this route for help
	static describe () {
		return {
			tag: 'provider-refresh',
			summary: 'Refreshes an access token associated with a third-party provider',
			access: 'Access tokens are issued per team, so user must be a member of the team passed with the request',
			description: 'Given a refresh token issued by a third-party provider, use that refresh token to fetch a new access token from the provider',
			input: {
				summary: 'Specify teamId in the query',
				looksLike: {
					'teamId*': '<ID of the team for which provider access is required>',
				}
			},
			returns: {
				summary: 'Returns a directive indicating how to update the user object with new token data',
				looksLike: {
					user: '<user directive>'
				}
			},
			errors: [
				'readAuth',
				'parameterRequired',
				'unknownProvider',
				'notFound'
			]
		};
	}
}

module.exports = ProviderRefreshRequest;
