// handle the "POST /provider-request" request to obtain a new access token given a refresh token 

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderRefreshRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
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
		await this.fetchAccessToken();	// fetch the access token from the third-party provider
		await this.saveToken();			// save the access token for the user
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['refreshToken', 'teamId']
				},
				optional: {
					string: ['_mockToken']
				}
			}
		);
		this.refreshToken = decodeURIComponent(this.request.query.refreshToken);
	}

	// get the team the user is authed with
	async getTeam () {
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// perform an exchange of auth code for access token, as needed
	async fetchAccessToken () {
		if (typeof this.serviceAuth.refreshToken !== 'function') {
			throw this.errorHandler.error('readAuth', { reason: 'token refresh not supported by provider' });
		}
		const { authOrigin } = this.api.config.api;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			refreshToken: this.refreshToken,
			provider: this.provider,
			redirectUri, 
			request: this,
			mockToken: this.request.query._mockToken
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
		const modifiedAt = Date.now();
		const op = {
			$set: {
				[`providerInfo.${this.team.id}.${this.provider}`]: this.tokenData,
				modifiedAt
			}
		};

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
			await this.api.services.messager.publish(
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
				summary: 'Specify teamId and refreshToken in the query',
				looksLike: '?teamId=<teamId>&refreshToken=<refreshToken>'
			},
			returns: {
				summary: 'Returns a directive indicating how to update the @@#user object#user object@@ with new token data',
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
