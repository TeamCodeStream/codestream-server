// handle the "POST /no-auth/provider-token" request to handle result of a user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');

class ProviderTokenRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
		this.errorHandler.add(AuthenticatorErrors);
	}

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		// determine the authorization service to use, based on the provider
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		if (await this.preProcessHook()) {
			return;
		}
		await this.validateState();			// decode the state token and validate
		await this.exchangeAuthCodeForToken();	// exchange the given auth code for an access token, as needed
		await this.getUser();				// get the user initiating the auth request
		await this.getTeam();				// get the team the user is authed with
		await this.saveToken();				// save the provided token
		await this.sendResponse();			// send the response html
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['state']
				},
				optional: {
					string: ['token', 'code', '_mockToken']
				}
			}
		);
	}

	// allow for individual providers to do pre-processing of the incoming data
	async preProcessHook () {
		if (typeof this.serviceAuth.preProcessTokenCallback !== 'function') {
			return false;
		}
		const options = {
			state: this.request.query.state,
			provider: this.provider,
			request: this,
			mockToken: this.request.query._mockToken
		};
		const result = await this.serviceAuth.preProcessTokenCallback(options); 
		if (typeof result === 'object') {
			this.tokenData = result;
			return false;
		}
		else if (result) { 
			return false;	
		}
		else {
			return true;	// indicates to stop further processing
		}
	}

	// decode the state token and validate
	async validateState () {
		let stateToken = this.request.query.state;
		const delimiter = stateToken.indexOf('!');
		if (delimiter !== -1) {
			stateToken = stateToken.substr(delimiter + 1);
		}
		let payload;
		try {
			payload = this.api.services.tokenHandler.verify(stateToken);
		}
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			if (message === 'jwt expired') {
				throw this.errorHandler.error('tokenExpired');
			}
			else {
				throw this.errorHandler.error('tokenInvalid', { reason: message });
			}
		}
		if (payload.type !== 'pauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}
		this.userId = payload.userId;
		this.teamId = payload.teamId;
	}

	// perform an exchange of auth code for access token, as needed
	async exchangeAuthCodeForToken () {
		if (typeof this.serviceAuth.exchangeAuthCodeForToken !== 'function') {
			return;
		}
		const { authOrigin } = this.api.config.api;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			code: this.request.query.code || '',
			provider: this.provider,
			state: this.request.query.state,
			redirectUri, 
			request: this,
			mockToken: this.request.query._mockToken
		};
		try {
			this.tokenData = await this.serviceAuth.exchangeAuthCodeForToken(options);
		}
		catch (error) {
			throw this.errorHandler.error('updateAuth', { info: error });
		}
	}

	// get the user initiating the auth request
	async getUser () {
		this.user = await this.data.users.getById(this.userId);
		if (!this.user || this.user.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// get the team the user is authed with
	async getTeam () {
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('updateAuth', { reason: 'user is not on the indicated team' });			
		}
		this.team = await this.data.teams.getById(this.teamId);
		if (!this.team || this.team.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
	}

	// save the provided token for the user
	async saveToken () {
		const token = (this.tokenData && this.tokenData.accessToken) || this.request.query.token;
		if (!token) {
			throw this.errorHandler.error('updateAuth', { reason: 'token not returned from provider' });
		}
		this.tokenData = this.tokenData || { accessToken: token };
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

	// send the response html
	async sendResponse () {
		this.response.type('text/html');
		let html = '<p>All set!</p>';
		if (this.serviceAuth && typeof this.serviceAuth.getAfterAuthHtml === 'function') {
			html = this.serviceAuth.getAfterAuthHtml();
		}
		this.response.send(html);
		this.responseHandled = true;
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
			tag: 'provider-token',
			summary: 'Completes the authorization of a third-party provider by storing the resulting token',
			access: 'No authorization needed, authorization is handled by looking at the provided state object',
			description: 'Once third-party authorization is complete, this request is the callback to store the token retrieved by auth against the third-party provider',
			input: {
				summary: 'Specify parmaeters in the query',
				looksLike: {
					'state*': '<State token generate by call to provider-auth>',
					'code': '<Authorization code, which will then be used to exchange for an access token>',
					'token': '<Access token, bypassing exchange of auth code for access token>'
				}
			},
			returns: 'html text to display when the authorization process is complete',
			publishes: 'directive to update the user object with the appropriate token',
			errors: [
				'parameterRequired',
				'tokenExpired',
				'tokenInvalid',
				'notFound',
				'updateAuth'
			]
		};
	}
}

module.exports = ProviderTokenRequest;
