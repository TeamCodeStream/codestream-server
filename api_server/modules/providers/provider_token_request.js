// handle the "POST /no-auth/provider-token" request to handle result of a user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const WebErrors = require(process.env.CS_API_TOP + '/modules/web/errors');
const ModelSaver = require(process.env.CS_API_TOP + '/lib/util/restful/model_saver');
const ProviderIdentityConnector = require('./provider_identity_connector');
const UserPublisher = require('../users/user_publisher');
const ErrorHandler = require(process.env.CS_API_TOP + '/server_utils/error_handler');
const SecretsConfig = require(process.env.CS_API_TOP + '/config/secrets');

class ProviderTokenRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
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

			await this.requireAndAllow();		// require certain parameters, discard unknown parameters
			if (await this.extractFromFragmentAsNeeded()) {
				return;
			}
			await this.validateState();			// decode the state token and validate
			if (this.handleError()) {			// check for error condition passed in
				return;
			}
			if (this.userId !== 'anon') {
				await this.getUser();				// get the user initiating the auth request
				await this.getTeam();				// get the team the user is authed with
			}
			await this.exchangeAuthCodeForToken();	// exchange the given auth code for an access token, as needed
			if (this.userId === 'anon') {
				await this.matchOrCreateUser();
				await this.saveSignupToken();
			}
			else {
				await this.saveToken();				// save the provided token
			}
			await this.sendResponse();			// send the response html
		}
		catch (error) {
			this.warn(ErrorHandler.log(error));
			this.errorCode = typeof error === 'object' && error.code ? error.code : WebErrors['unknownError'].code;
			// if we have a url to redirect to, redirect with an error, rather
			// than just throwing
			if (
				this.tokenPayload &&
				this.tokenPayload.url
			) {
				let url = `${this.tokenPayload.url}?state=${this.request.query.state}&error=${this.errorCode}`;
				if (this.userIdentity && this.userIdentity.email) {
					url += `&email=${encodeURIComponent(this.userIdentity.email)}`;
				}
				this.response.redirect(url);
			}
			else {
				const message = error instanceof Error ? error.message : JSON.stringify(error);
				this.warn('Error handling provider token request: ' + message);
				let url = `/web/error?state=${this.request.query.state}&code=${this.errorCode}&provider=${this.provider}`;
				this.response.redirect(url);
			}
			await this.saveSignupToken();
			this.responseHandled = true;
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		// mock token must be accompanied by secret
		if (this.request.query._mockToken && decodeURIComponent(this.request.query._secret || '') !== SecretsConfig.confirmationCheat) {
			this.warn('Deleting mock token because incorrect secret sent');
			delete this.request.query._mockToken;
			delete this.request.query._mockEmail;
		}
		delete this.request.query._secret;

		await this.requireAllowParameters(
			'query',
			{
				optional: {
					string: ['state', 'token', 'code', 'token_type', 'expires_in' ,'scope', 'error', 'oauth_token', '_mockToken', '_mockEmail']
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
			try {
				this.tokenPayload = this.api.services.tokenHandler.decode(this.stateToken);
			}
			catch (e) { this.warn('error decoding state token'); }
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
		this.providerAccess = this.tokenPayload.access;
		this.sharing = this.tokenPayload.sm;
		this.noAllowSignup = this.tokenPayload.noSU;

		if (this.serviceAuth.usesOauth1()) {
			let secretPayload;
			try {
				secretPayload = this.api.services.tokenHandler.decode(stateProps[3]);
			}
			catch (error) {
				throw this.errorHandler.error('tokenInvalid', { reason: 'unable to obtain token secret' });
			}
			if (!secretPayload || secretPayload.type !== 'oasec') {
				throw this.errorHandler.error('tokenInvalid', { reason: 'token secret is not of the correct type' });
			}
			this.oauthToken = {
				oauthToken: decodeURIComponent(this.request.query.oauth_token),
				oauthTokenSecret: secretPayload.sec
			};
		}
	}

	// handle any error sent by the provider
	handleError () {
		if (!this.request.query.error) { return; }
		this.errorCode = this.noAllowSignup ? this.errorHandler.error('providerLoginFailed').code : this.request.query.error;
		this.providerError = this.noAllowSignup && this.request.query.error;
		this.saveSignupToken();
		let url = `/web/error?state=${this.request.query.state}&code=${this.errorCode}&provider=${this.provider}`;
		if (this.providerError) {
			url += `&providerError=${this.providerError}`;
		}
		this.response.redirect(url);
		this.responseHandled = true;
		return true;
	}

	// perform an exchange of auth code for access token, as needed
	async exchangeAuthCodeForToken () {
		if (this.serviceAuth.usesOauth1()) {
			return await this.getOauth1AccessToken();
		}
		if (!this.serviceAuth.exchangeRequired()) {
			return;
		}
		const { authOrigin } = this.api.config.api;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			code: this.request.query.code || '',
			state: this.request.query.state,
			redirectUri, 
			request: this,
			mockToken: this.request.query._mockToken,
			host: this.host,
			team: this.team,
			access: this.providerAccess,
			sharing: this.sharing
		};
		try {
			this.tokenData = await this.serviceAuth.exchangeAuthCodeForToken(options);
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			throw this.errorHandler.error('updateAuth', { info: message });
		}
	}

	// get an OAuth 1.0 access token
	async getOauth1AccessToken () {
		const team = await this.data.teams.getById(this.teamId);
		if (!team) {
			throw this.errorHandler.error('notFound', { info: 'team' });
		}
		const { oauthToken, oauthTokenSecret } = this.oauthToken;
		const options = {
			request: this,
			oauthToken,
			oauthTokenSecret,
			host: this.host,
			team: team,
			mockToken: this.request.query._mockToken
		};
		this.tokenData = await this.serviceAuth.getOauth1AccessToken(options);
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

		// add sub-keys for enterprise hosts
		if (this.host) {
			const host = this.host.replace(/\./g, '*');
			setKey += `.hosts.${host}`;
		}

		// add sub-keys for providers that support multiple access tokens, only allowed in sharing model
		if (this.sharing) {
			const multiAuthKey = this.serviceAuth.getMultiAuthKey(this.tokenData);
			if (multiAuthKey) {
				setKey += `.multiple.${multiAuthKey}`;
			}
		}

		const op = {};
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
			apiConfig: this.api.config[this.provider],
			providerInfo: { 
				code: this.request.query.code,
				mockEmail: this.request.query._mockEmail
			},
			request: this
		});

		// now attempt to match the identifying info with an existing user
		await this.matchUser(this.userIdentity); 
	}
	
	// match the identifying information with an existing CodeStream user
	async matchUser (userIdentity) {
		this.connector = new ProviderIdentityConnector({
			request: this,
			provider: this.provider,
			okToCreateUser: this.userId === 'anon',
			okToCreateTeam: !this.noAllowSignup && this.userId === 'anon',
			okToFindExistingUserByEmail: !this.noAllowSignup,
			tokenData: this.tokenData
		});
		await this.connector.connectIdentity(userIdentity);
		this.user = this.connector.user;
		this.team = this.connector.team;

		// set signup status
		if (this.connector.createdTeam) {
			this.signupStatus = 'teamCreated';
		}
		else if (this.connector.createdUser) {
			this.signupStatus = 'userCreated';
		}
		else {
			this.signupStatus = 'signedIn';
		}
	}

	// if a signup token is provided, this allows a client session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		const token = (this.tokenPayload && this.tokenPayload.st) || this.stateToken;
		await this.api.services.signupTokens.insert(
			token,
			this.user ? this.user.id : null,
			{ 
				requestId: this.request.id,
				more: {
					signupStatus: this.signupStatus,
					error: this.errorCode,
					providerError: this.providerError,
					provider: this.provider,
					providerAccess: this.providerAccess,
					teamId: this.team && this.team.id,
					sharing: this.sharing
				}
			}
		);
	}

	// send the response html
	async sendResponse () {
		const host = this.api.config.webclient && this.api.config.webclient.marketingHost;
		const authCompletePage = this.serviceAuth.getAuthCompletePage();
		const redirect = this.tokenPayload && this.tokenPayload.url ? 
			`${decodeURIComponent(this.tokenPayload.url)}?state=${this.request.query.state}` :
			`${host}/auth-complete/${authCompletePage}`;
		this.response.redirect(redirect);
		this.responseHandled = true;
	}

	// after a response is returned....
	async postProcess () {
		if (!this.user) { return; }
		// new users get published to the team channel
		if (this.connector && (this.connector.userWasConfirmed || this.connector.userWasAddedToTeam)) {
			await this.publishUserToTeams();
		}
		if (this.transforms.userUpdate) {
			await this.publishUserToSelf();
		}
	}

	// publish the new user to the team channel
	async publishUserToTeams () {
		await new UserPublisher({
			user: this.user,
			data: this.user.getSanitizedObject(),
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// publish updated user to themselves, because their identity token has changed
	async publishUserToSelf () {
		const data = {
			user: Object.assign(
				{
					_id: this.user.id,	// DEPRECATE ME
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
