// handle the "POST /no-auth/provider-token" request to handle result of a user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request.js');
const WebErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/web/errors');
const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const ProviderIdentityConnector = require('./provider_identity_connector');
const UserPublisher = require('../users/user_publisher');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');
const NewRelicIDPErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/newrelic_idp/errors');

class ProviderTokenRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler = this.module.errorHandler;
		this.errorHandler.add(NewRelicIDPErrors);
	}

	async authorize () {
		// no authorization necessary, authorization is handled by the processing logic
	}

	// process the request...
	async process () {
		try {
			if (this.request.path.match(/~nrlogin/)) {
				this.log('NEWRELIC IDP TRACK: ~nrlogin called from New Relic IDP');
				this.request.params.provider = 'newrelicidp';
				this.request.headers['x-cs-enable-uid'] = '1'; // request can only come from Unified Identity, and we need this to trigger additional code
			}

			// determine the authorization service to use, based on the provider
			this.isClientToken = this.request.method.toLowerCase() === 'post';
			this.provider = this.request.params.provider.toLowerCase();
			this.serviceAuth = this.api.services[`${this.provider}Auth`];
			if (!this.serviceAuth) {
				throw this.errorHandler.error('unknownProvider', { info: this.provider });
			}

			// this method of setting a provider token is only supported for github right now
			if (this.isClientToken && this.provider !== 'github') {
				throw this.errorHandler.error('providerNotAllowed', { info: this.provider });
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
			this.log('NEWRELIC IDP TRACK: Exchanging auth code for ID token...');
			await this.exchangeAuthCodeForToken();	// exchange the given auth code for an access token, as needed
			this.log('NEWRELIC IDP TRACK: Obtained NR ID token');
			if (this.userId === 'anon') {
				await this.matchOrCreateUser();
				await this.saveSignupToken();
			}
			else {
				await this.saveToken();				// save the provided token
				await this.saveServerToken();		// save the provided server token to the team
			}
			await this.sendResponse();			// send the response html
		}
		catch (error) {
			if (this.isClientToken) {
				throw error;
			}
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
			delete this.user;
			await this.saveSignupToken();
			this.responseHandled = true;
		}
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		const which = this.isClientToken ? 'body' : 'query';
		const input = this.isClientToken ? this.request.body : this.request.query;

		// let's explicitly deprecate the user of invite codes and repo-signups
		if (this.request[which].invite_code) {
			throw this.errorHandler.error('deprecated', { reason: 'invite codes are deprecated' });
		} else if (this.request[which].repo_info) {
			throw this.errorHandler.error('deprecated', { reason: 'repo-based signup is deprecated' });
		}

		// mock token must be accompanied by secret
		if (input._mockToken && decodeURIComponent(input._secret || '') !== this.api.config.sharedSecrets.confirmationCheat) {
			this.warn('Deleting mock token because incorrect secret sent');
			delete input._mockToken;
			delete input._mockEmail;
		}
		delete input._secret;

		const requireAllow = {
			optional: {
				boolean: [
					'no_signup'
				],
				string: [
					'state',
					'token',
					'code',
					'token_type',
					'expires_in',
					'scope',
					'error',
					'oauth_token',
					'signup_token',
					'_mockToken',
					'_mockEmail'
				],
				object: [
					'data'
				]
			}
		};
		if (this.isClientToken) {
			requireAllow.required = {
				string: ['token']
			};
		}
		await this.requireAllowParameters(which, requireAllow);
	}

	async extractFromFragmentAsNeeded () {
		if (!this.serviceAuth.tokenFromFragment || !this.serviceAuth.tokenFromFragment()) {
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
		// st (signup token) sent in the path comes from New Relic login and is a special case,
		// i.e., it kind of looks like OAuth but it really isn't
		if (this.request.params.st) {
			const parts = this.request.params.st.split('.');
			this.stateToken = parts[0];
			for (let i = 1; i < parts.length; i++) {
				const subParts = parts[i].split('~');
				if (subParts[0] === 'JCID') {
					this.joinCompanyId = subParts[1];
					this.log(`Join company ID of ${this.joinCompanyId} found in signup token`);
				} else if (subParts[0] === 'AUID') {
					this.anonUserId = subParts[1];
					this.log(`Anon user ID of ${this.anonUserId} found in signup token`);
				} else if (subParts[0] === 'NOSU') {
					this.noSignup = true;
					this.log('No signup directive found in signup token');
				}
			}
			this.fromNewRelicLogin = true;
			this.userId = 'anon';
			return;
		} else if (this.isClientToken) {
			this.userId = 'anon';
			this.stateToken = this.request.body.signup_token;
			this.noSignup = this.request.body.no_signup;
			this.machineId = this.request.body.machine_id;
			return;
		}
		if (!this.request.query.state) {
			throw this.errorHandler.error('parameterRequired', { info: 'state' });
		}
		const stateProps = this.request.query.state.split('!');
		this.stateToken = stateProps[1];
		if (stateProps[2]) {
			this.host = this.specialDecode(stateProps[2]);
		}

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
		if (this.tokenPayload.type !== 'pauth' && this.tokenPayload.type !== 'rauth') {
			throw this.errorHandler.error('tokenInvalid', { reason: 'not a provider authorization token' });
		}

		// let's explicitly deprecate the user of invite codes and repo-signups
		if (this.tokenPayload.ic) {
			throw this.errorHandler.error('deprecated', { reason: 'invite codes are deprecated' });
		} else if (this.tokenPayload.ri) {
			throw this.errorHandler.error('deprecated', { reason: 'repo-based signup is deprecated' });
		}

		this.userId = this.tokenPayload.userId;
		this.teamId = this.tokenPayload.teamId;
		this.providerAccess = this.tokenPayload.access;
		this.sharing = this.tokenPayload.sm;
		this.noAllowSignup = !this.tokenPayload.suok && !this.serviceAuth.supportsSignup();
		this.noSignup = this.tokenPayload.nosu;
		this.hostUrl = this.tokenPayload.hu;
		this.machineId = this.tokenPayload.mi;

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

	// decode a string from special encoding that does not rely on encodeURIComponent,
	// since proxies can decode encoded characters and mess things up
	// this should match the encode algorithm in provider_auth_request.js
	specialDecode (str) {
		return str.replace(/\*\*\*\(_colon_\)/g, ':').replace(/\*\*\*\(_slash_\)/g, '/');
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
		if (this.isClientToken) {
			return;
		}
		if (this.serviceAuth.usesOauth1()) {
			return await this.getOauth1AccessToken();
		}
		if (!this.serviceAuth.exchangeRequired()) {
			return;
		}
		const { authOrigin } = this.api.config.apiServer;
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
			sharing: this.sharing,
			hostUrl: this.hostUrl
		};
		try {
			const tokenData = await this.serviceAuth.exchangeAuthCodeForToken(options);
			if (!tokenData.accessToken && tokenData.userToken) {
				this.tokenData = tokenData.userToken;
				this.serverTokenData = tokenData.serverToken;
			} else {
				this.tokenData = tokenData;
			}
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
	/* eslint complexity: 0 */
	async saveToken () {
		const input = this.isClientToken ? this.request.query : this.request.body;
		const token = (this.tokenData && this.tokenData.accessToken) || input.token;
		if (!token) {
			throw this.errorHandler.error('updateAuth', { reason: 'token not returned from provider, tokenData is ' + JSON.stringify(this.tokenData) });
		}
		this.tokenData = this.tokenData || { accessToken: token };
		if (this.request.body.data) {
			this.tokenData.data = this.request.body.data;
		}
		const modifiedAt = Date.now();

		// if (and only if) the user previously had credentials above the team level (as in, they used the provider for sign-in),
		// ignore the team parameter and set the data at that level ... this supports a re-auth in case their original token starts failing
		let setKey;
		if (
			(this.user.get('providerInfo') || {})[this.provider] &&
			(this.user.get('providerInfo') || {})[this.provider].accessToken
		) {
			setKey = `providerInfo.${this.provider}`;
		} else {
			setKey = `providerInfo.${this.team.id}.${this.provider}`;
			if (this.host) {
				const host = this.host.replace(/\./g, '*');
				setKey += `.hosts.${host}`;
			}
		}

		// add sub-keys for enterprise hosts
		// add sub-keys for providers that support multiple access tokens, only allowed in sharing model
		let multiKeys = {};
		const op = { $set: {}, $unset: {} };
		if (this.sharing) {
			const multiAuthExtraData = await this.serviceAuth.getMultiAuthExtraData(this.tokenData, { request: this });
			if (multiAuthExtraData) {
				const multiAuthKeyExtraDataBySetKey = Object.keys(multiAuthExtraData).reduce(function (map, key) {
					map[`${setKey}.multiple.${key}`] = multiAuthExtraData[key];
					return map;
				}, {});
				multiKeys = { ...multiAuthKeyExtraDataBySetKey };
			}

			const providerUserId = await this.serviceAuth.getUserId(this.tokenData);
			if (providerUserId) {
				const identity = `${this.provider}::${providerUserId}`;
				if (!(this.user.get('providerIdentities') || []).find(id => id === identity)) {
					op.$addToSet = { providerIdentities: identity };
				}
			}
		}
		else {
			multiKeys[setKey] = undefined;
		}

		for (let multiKey of Object.keys(multiKeys)) {
			for (let key of Object.keys(this.tokenData)) {
				const dataKey = `${multiKey}.${key}`;
				op.$set[dataKey] = this.tokenData[key];
			}
			if (multiKeys[multiKey]) {
				op.$set[`${multiKey}.extra`] = Object.assign({}, op.$set[`${multiKey}.extra`] || {}, multiKeys[multiKey]);
			}

			// remove any previous token error
			op.$unset[`${multiKey}.tokenError`] = true;
		}

		op.$set.modifiedAt = modifiedAt;
		this.transforms.userUpdate = await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: this.user.id
		}).save(op);
	}

	// save server token for team
	async saveServerToken () {
		if (!this.serverTokenData || !this.serverTokenData.data || !this.serverTokenData.data.team_id) {
			return;
		}
		const multiAuthKey = await this.serviceAuth.getServerTokenMultiAuthKey(this.serverTokenData);
		if (!multiAuthKey) {
			return;
		}
		const subKey = `${this.provider}.multiple.${multiAuthKey}`;
		const tokenOp = {
			$set: {}
		};
		const dataOp = {
			$set: {}
		};
		tokenOp.$set[`serverProviderToken.${subKey}`] = this.serverTokenData.accessToken;
		dataOp.$set[`serverProviderData.${subKey}`] = this.serverTokenData.data;
		await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(tokenOp);
		this.transforms.teamUpdate = await new ModelSaver({
			request: this,
			collection: this.data.teams,
			id: this.team.id
		}).save(dataOp);
	}

	// this auth started out anonymously, so try to find a match for the user,
	// and possibly create one if needed
	async matchOrCreateUser () {
		// get access token
		const input = this.isClientToken ? this.request.body : this.request.query;
		const token = (this.tokenData && this.tokenData.accessToken) || input.token;
		if (!token) {
			throw this.errorHandler.error('updateAuth', { reason: 'token not returned from provider, tokenData is ' + JSON.stringify(this.tokenData) });
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
				code: input.code,
				mockEmail: input._mockEmail
			},
			hostUrl: this.hostUrl,
			request: this
		});
		if (!this.userIdentity.email) {
			throw this.errorHandler.error('updateAuth', { reason: 'no email in identifying data' });
		}
		if (this.provider === 'newrelicidp') {
			const showUserIdentity = { ...this.userIdentity };
			if (showUserIdentity.idpAccessToken) {
				showUserIdentity.idpAccessToken = '<redacted>' + this.userIdentity.idpAccessToken.slice(-7);
			}
			this.log('NEWRELIC IDP TRACK: User identity: ' + JSON.stringify(showUserIdentity, 0, 5));
		}

		// check if we need to redirect to another region
		if (await this.handleRegion()) {
			// we're redirecting to a new region host, abort further processing
			return;
		}

		// now attempt to match the identifying info with an existing user
		await this.matchUser(this.userIdentity);
	}

	// match the identifying information with an existing CodeStream user
	async matchUser (userIdentity) {
		if (this.request.body.data) {
			this.tokenData = this.tokenData || {};
			this.tokenData.data = this.tokenData.data || {};
			Object.assign(this.tokenData.data, this.request.body.data);
		}
		const wasNREmailSignOn = this.provider === 'newrelicidp' && !this.userIdentity.idpAccessToken;
		const wasNRCodeHostSignOn = this.provider === 'newrelicidp' && this.userIdentity.idpAccessToken;
		const okToCreateUser = this.userId === 'anon' && (!this.noSignup || wasNREmailSignOn);
		this.connector = new ProviderIdentityConnector({
			request: this,
			provider: this.provider,
			okToCreateUser,
			wasNRCodeHostSignOn,
			tokenData: this.tokenData,
			hostUrl: this.hostUrl,
			machineId: this.machineId,
			joinCompanyId: this.joinCompanyId
		});
		const showIdentity = { ...userIdentity };
		if (showIdentity.idpAccessToken){
			showIdentity.idpAccessToken = '<redacted>' + userIdentity.idpAccessToken.slice(-7);
		}
		this.log('NEWRELIC IDP TRACK: Connecting user identity: ' + JSON.stringify(showIdentity, 0, 5));
	
		await this.connector.connectIdentity(userIdentity);
		this.user = this.connector.user;
		this.team = this.connector.team;
		this.log('NEWRELIC IDP TRACK: Connected user identity');
		
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

		// a "social user" was created if NewRelic IDP used social for signup, and
		// a user was created in that process, or a registered user was found with
		// no team, meaning a signup that was aborted earlier
		if (
			this.connector.wasIDPSocialSignup &&
			(
				this.connector.createdUser ||
				(
					// treat a registered, but teamless, user as an aborted sign-up
					this.user &&
					(this.user.get('teamIds') || []).length === 0
				) 
			)
		) {
			this.log('NEWRELIC IDP TRACK: This was a social signup, and created a user, or found an unregistered teamless user');
			this.socialUserCreated = true;
		}
	}

	// if a signup token is provided, this allows a client session to identify the user ID that was eventually
	// signed up as it originated from the IDE
	async saveSignupToken () {
		if (this.socialUserCreated) {
			this.log('NEWRELIC IDP TRACK: Was IDP social signup, not saving signup token');
			return;
		}
		this.log('NEWRELIC IDP TRACK: Saving signup token...');
		
		const token = (this.tokenPayload && this.tokenPayload.st) || this.stateToken;
		let expiresIn = this.request.query && this.request.query.expires_in;
		if (expiresIn) {
			expiresIn = parseInt(expiresIn);
		}
		await this.api.services.signupTokens.insert(
			token,
			this.user ? this.user.id : null,
			{
				requestId: this.request.id,
				expiresIn,
				more: {
					signupStatus: this.signupStatus,
					error: this.errorCode,
					providerError: this.providerError,
					provider: this.provider,
					providerAccess: this.providerAccess,
					teamId: this.team && this.team.id,
					sharing: this.sharing,
					switchToServerUrl: this.redirectHost
				}
			}
		);
	}

	// send the response html
	async sendResponse () {
		if (this.isClientToken) {
			return;
		}

		if (this.socialUserCreated) {
			this.log('NEWRELIC IDP TRACK: Was IDP social signup, redirecting to web-based domain picker...');
			this.issueCookie();			
			return this.redirectToDomainPicker(this.connector.createdUser || this.user);
		}

		let redirect = this.redirectUrl;
		if (!redirect) {
			const host = this.api.config.apiServer.marketingSiteUrl;
			const authCompletePage = this.serviceAuth.getAuthCompletePage();
			redirect = this.provider === 'newrelicidp'
				? '/web/signed-in'
				: this.tokenPayload && this.tokenPayload.url
				? `${decodeURIComponent(this.tokenPayload.url)}?state=${this.request.query.state}`
				: `${host}/auth-complete/${authCompletePage}`;
			// TODO: issue cookie in case of New Relic login
			if (this.tokenPayload && this.tokenPayload.url) {
				this.issueCookie();			
			}
		}

		this.log('NEWRELIC IDP TRACK: Provider token request redirecting to: ' + redirect);
		this.response.redirect(redirect);
		this.responseHandled = true;
	}

	// redirect to the api-web domain picker page, as the final step of social signup
	redirectToDomainPicker (user) {
		// generate a new short-lived state token with the created user's ID embedded
		const payload = {
			uid: user.id,
			st: this.stateToken
		};
		if (this.anonUserId) {
			payload.auid = this.anonUserId;
		}
		const state = this.api.services.tokenHandler.generate(
			payload,
			'dpck',
			{ expiresAt: Date.now() + 60 * 1000 }
		);

		let originalProvider = '';
		if (user && user.attributes && user.attributes.providerInfo && Object.keys(user.attributes.providerInfo).length > 0) {
			originalProvider = Object.keys(user.attributes.providerInfo)[0];
		}

		const url = `/web/domain-picker/${this.provider}?t=${state}&p=${originalProvider}`;
		this.response.redirect(url);
		this.responseHandled = true;
	}

	// issue a cookie for web login
	issueCookie () {
		const token =
			(this.user.get('accessTokens') || {}) &&
			(this.user.get('accessTokens').web || {}) &&
			this.user.get('accessTokens').web.token;
		if (!token) { return; }

		this.response.cookie(this.api.config.apiServer.identityCookie, token, {
			secure: true,
			signed: true
		});
	}

	// for New Relic IDP login, look at the region, and if it doens't match our region,
	// redirect to the server in the proper region, let "them" handle this
	async handleRegion () {
		const { environmentGroup, sharedGeneral } = this.api.config;
		const { runTimeEnvironment, isProductionCloud } = sharedGeneral;

		// only applies to New Relic IDP
		if (this.provider !== 'newrelicidp') { return; }

		// since New Relic staging has no EU, we'll "simulate" by looking for emails
		// matching a certain pattern
		let { region, email } = this.userIdentity;
		let enforceRegion;
		if (!isProductionCloud) { 
			if (email.match(/\/+testus/)) {
				enforceRegion = 'us01';
			} else if (email.match(/\+testeu/)) {
				enforceRegion = 'eu01';
			}
		} else {
			enforceRegin = region;
		}
		if (!enforceRegion || !environmentGroup) { return; }

		// switch to a different host as needed
		const switchToGroup = {
			'us01': {
				'eu1': 'us1',
				'pd2': 'pd',
				'local2': 'local1'
			},
			'eu01': {
				'us1': 'eu1',
				'pd': 'pd2',
				'local1': 'local2'
			}
		};
		if (switchToGroup[enforceRegin] &&
			switchToGroup[enforceRegin][runTimeEnvironment] &&
			environmentGroup[switchToGroup[enforceRegin][runTimeEnvironment]]
		) {
			this.redirectHost = environmentGroup[switchToGroup[enforceRegin][runTimeEnvironment]].publicApiUrl;
			this.redirectUrl = `${this.redirectHost}${this.request.path}?` + Object.keys(this.request.query).map(param => {
				return `${param}=${this.request.query[param]}`;
			}).join('&');
			this.log(`New Relic region is ${enforceRegin}, switching to host ${this.redirectHost}...`);
			return true;
		}
	}

	// after a response is returned....
	async postProcess () {
		if (!this.user) { return; }
		// new users get published to the team channel
		if (this.connector && this.connector.userWasConfirmed) {
			await this.publishUserToTeams();
		}
		if (this.transforms.userUpdate) {
			await this.publishUserToSelf();
		}
		if (this.transforms.teamUpdate) {
			await this.publishTeamToSelf();
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

	async publishTeamToSelf () {
		const data = {
			team: Object.assign(
				{
					_id: this.team.id,
					id: this.team.id
				},
				this.transforms.teamUpdate
			),
			requestId: this.request.id
		};
		const channel = `team-${this.team.id}`;
		try {
			await this.api.services.broadcaster.publish(
				data,
				channel,
				{ request: this }
			);
		} catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish team update to team ${this.team.id}: ${JSON.stringify(error)}`);
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
