// handle the "POST /no-auth/provider-token" request to handle result of a user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const AuthenticatorErrors = require(process.env.CS_API_TOP + '/modules/authenticator/errors');
const Errors = require('./errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const ProviderIdentityConnector = require('./provider_identity_connector');

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
		try {
			// determine the authorization service to use, based on the provider
			this.provider = this.request.params.provider.toLowerCase();
			this.serviceAuth = this.api.services[`${this.provider}Auth`];
			if (!this.serviceAuth) {
				throw this.errorHandler.error('unknownProvider', { info: this.provider });
			}
			else if (this.request.query.error) {
				this.response.redirect('/web/error?code=' + this.request.query.error);
				this.responseHandled = true;
				return;
			}

			await this.requireAndAllow();		// require certain parameters, discard unknown parameters
			if (await this.extractFromFragmentAsNeeded()) {
				return;
			}
			await this.validateState();			// decode the state token and validate
			if (!this.userId.startsWith('anon')) {
				await this.getUser();				// get the user initiating the auth request
				await this.getTeam();				// get the team the user is authed with
			}
			await this.exchangeAuthCodeForToken();	// exchange the given auth code for an access token, as needed
			if (this.userId === 'anon' || this.userId === 'anonCreate') {
				await this.matchOrCreateUser();
				await this.saveSignupToken();
			}
			await this.saveToken();				// save the provided token
			await this.sendResponse();			// send the response html
		}
		catch (error) {
			// if we have a url to redirect to, redirect with an error, rather
			// than just throwing
			if (
				this.tokenPayload &&
				this.tokenPayload.url &&
				typeof error === 'object' &&
				error.code
			) {
				let url = `${this.tokenPayload.url}?error=${error.code}&state=${this.request.query.state}`;
				if (this.userIdentity && this.userIdentity.email) {
					url += `&email=${encodeURIComponent(this.userIdentity.email)}`;
				}
				this.response.redirect(url);
				this.responseHandled = true;
			}
			else {
				throw error;
			}
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				optional: {
					string: ['state', 'token', 'code', 'token_type', 'expires_in' ,'scope', 'error', '_mockToken']
				}
			}
		);
	}

	async extractFromFragmentAsNeeded () {
		if (!this.serviceAuth.tokenFromFragment()) {
			return;
		}
		const options = {
			state: this.request.query.state || '',
			request: this,
			mockToken: this.request.query._mockToken
		};
		const result = await this.serviceAuth.extractTokenFromFragment(options); 
		if (typeof result === 'object') {
			Object.assign(result, this.request.query);
			delete result.state;
			this.tokenData = this.serviceAuth.normalizeTokenDataResponse(result);
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
		if (!this.request.query.state) {
			throw this.errorHandler.error('parameterRequired', { info: 'state' });
		}
		const stateProps = this.request.query.state.split('!');
		this.stateToken = stateProps[1];
		this.host = stateProps[2];
		try {
			this.tokenPayload = this.api.services.tokenHandler.verify(this.stateToken);
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
		if (this.tokenPayload.type !== 'pauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}
		this.userId = this.tokenPayload.userId;
		this.teamId = this.tokenPayload.teamId;
	}

	// perform an exchange of auth code for access token, as needed
	async exchangeAuthCodeForToken () {
		if (!this.serviceAuth.exchangeRequired()) {
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
			mockToken: this.request.query._mockToken,
			host: this.host,
			team: this.team
		};
		try {
			this.tokenData = await this.serviceAuth.exchangeAuthCodeForToken(options);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw this.errorHandler.error('updateAuth', { info: message });
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
		let setKey = `providerInfo.${this.team.id}.${this.provider}`;
		if (this.host) {
			const host = this.host.replace(/\./g, '*');
			setKey += `.hosts.${host}`;
		}
		const op = this.transforms.userUpdate || {};
		delete op.id;
		delete op._id;
		op.$set = op.$set || {};
		for (let key of Object.keys(this.tokenData)) {
			const dataKey = `${setKey}.${key}`;
			op.$set[dataKey] = this.tokenData[key];
		}
		op.$set.modifiedAt = modifiedAt;

		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// this auth started out anonymously, so try to find a match for the user,
	// and possibly create one if needed
	async matchOrCreateUser () {
		// get access token
		const token = (this.tokenData && this.tokenData.accessToken) || this.request.query.token;
		if (!token) {
			throw this.errorHandler.error('updateAuth', { reason: 'token not returned from provider' });
		}

		// check that the third-party auth provider supports identity matching,
		// and if so, get identifying info
		if (typeof this.serviceAuth.getUserIdentity !== 'function') {
			throw this.errorHandler.error('identityMatchingNotSupported');
		}
		this.userIdentity = await this.serviceAuth.getUserIdentity({
			accessToken: token,
			request: this
		});

		// now attempt to match the identifying info with an existing user
		await this.matchUser(this.userIdentity); 
		if (this.user) {
			return;
		}
		else if (this.userId !== 'anonCreate') {
			// if no match found, throw an error unless we're allowed to create a user
			throw this.errorHandler.error('noIdentityMatch');
		}

		// TODO: here we create a new user, but not tackling that problem for now
	}
	
	// match the identifying information with an existing CodeStream user
	async matchUser (userIdentity) {
		this.connector = new ProviderIdentityConnector({
			request: this,
			provider: this.provider,
			okToCreateUser: this.userId === 'anonCreate',
			okToAddUserToTeam: this.userId === 'anonCreate',
			mustMatchTeam: this.userId === 'anon',
			mustMatchUser: this.userId === 'anon'
		});
		await this.connector.connectIdentity(userIdentity);
		this.user = this.connector.user;
		this.team = this.connector.team;
	}

	// if a signup token is provided, this allows a client session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		await this.api.services.signupTokens.insert(
			this.stateToken,
			this.user.id,
			{ 
				requestId: this.request.id
			}
		);
	}

	// send the response html
	async sendResponse () {
		const host = this.api.config.webclient.marketingHost;
		const authCompletePage = this.serviceAuth.getAuthCompletePage();
		const redirect = this.tokenPayload.url ? 
			`${decodeURIComponent(this.tokenPayload.url)}?state=${this.request.query.state}` :
			`${host}/auth-complete/${authCompletePage}`;
		this.response.redirect(redirect);
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
