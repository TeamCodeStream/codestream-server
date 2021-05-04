// provides a set of common routines for logging a user in

'use strict';

const InitialDataFetcher = require('./initial_data_fetcher');
const UserSubscriptionGranter = require('./user_subscription_granter');
const UUID = require('uuid/v4');
const ProviderFetcher = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/provider_fetcher');
const APICapabilities = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/etc/capabilities');
const VersionErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/versioner/errors');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');
const Fetch = require('node-fetch');

class LoginHelper {

	constructor (options) {
		Object.assign(this, options);
		this.loginType = this.loginType || 'web';
		this.request.errorHandler.add(VersionErrors);
		this.api = this.request.api;
		this.apiConfig = this.api.config;
	}

	// perform a true login for the user, including returning full response data
	async login () {
		if (this.user.get('inMaintenanceMode')) {
			throw this.request.errorHandler.error('inMaintenanceMode');
		}

		this.getCountryCode(); // NOTE - no await here, this is not part of the actual request flow

		await awaitParallel([
			this.getInitialData,
			this.generateAccessToken
		], this);
		this.grantSubscriptionPermissions(); // NOTE - no await here, this can run in parallel
		await this.updateLastLogin();
		this.getThirdPartyProviders();
		await this.formResponse();
		return this.responseData;
	}

	// prepare for the user being allowed to login, without actually generating the
	// response data needed for a true login
	async allowLogin () {
		await this.generateAccessToken();
		this.grantSubscriptionPermissions(); // NOTE - no await here, this can run in parallel
		this.getCountryCode(); // NOTE - no await here, this is not part of the actual request flow
	}

	// get the country-code associated with this user by IP address of the connection
	async getCountryCode () {
		// we hit a free third-party service for this, and it's not mission critial, so
		// set a strict timeout on it so as not to delay other operations
		let result;
		try {
			if (!this.request.request.connection) { return; }
			if (this.request.request.headers['x-cs-test-num']) { return; }
			let ip = this.request.request.get('x-forwarded-for');
			if (!ip) {
				const addr = this.request.request.connection.remoteAddress;
				ip = addr.split(':').pop();
			}
			const response = await Fetch('http://ip2c.org/' + ip, { timeout: 10000 });
			result = await response.text();
			this.countryCode = result.split(';')[1].trim();
			if (this.countryCode) {
				await this.request.data.users.updateDirect(
					{ id: this.request.data.users.objectIdSafe(this.user.id) },
					{ $set: { countryCode: this.countryCode } }
				);
			}
		}
		catch (error) {
			const message = error instanceof Error ? error.message : JSON.stringify(error);
			this.request.warn(`Unable to fetch country code: ${message}`);
		}
	}

	// get the initial data to return in the response, this is a time-saver for the client
	// so it doesn't have to fetch this data with separate requests
	async getInitialData () {
		this.initialDataFetcher = new InitialDataFetcher({
			request: this.request,
			user: this.user
		});
		this.initialData = await this.initialDataFetcher.fetchInitialData();
	}

	// generate an access token for this login if needed
	async generateAccessToken (force) {
		let set = null;

		// generate a unique PubNub token, to be stored with the user object, the one and only way a 
		// user can subscribe to PubNub (though for now, they can also subscribe with their access token,
		// but we will deprecate this ability once the old atom client is deprecated)
		this.pubnubToken = this.user.get('pubNubToken');
		if (!this.pubnubToken) {
			this.pubnubToken = (UUID() + '-' + UUID()).split('-').join('');
			set = set || {};
			set.pubNubToken = this.pubnubToken;
		}
		// set a more generic "broadcaster" token, to allow for other broadcaster solutions beside PubNub
		this.broadcasterToken = this.user.get('broadcasterToken');
		if (!this.broadcasterToken) {
			this.broadcasterToken = this.pubnubToken;
			set = set || {};
			set.broadcasterToken = this.broadcasterToken;
		}

		// look for a new-style token (with min issuance), if it doesn't exist, or our current token
		// was issued before the min issuance, then we need to generate a new token for this login type
		try {
			const currentTokenInfo = this.user.getTokenInfoByType(this.loginType);
			const minIssuance = typeof currentTokenInfo === 'object' ? (currentTokenInfo.minIssuance || null) : null;
			this.accessToken = typeof currentTokenInfo === 'object' ? currentTokenInfo.token : this.user.get('accessToken');
			const tokenPayload = (!force && this.accessToken) ? 
				this.api.services.tokenHandler.verify(this.accessToken) : 
				null;
			if (
				force ||
				!minIssuance ||
				minIssuance > (tokenPayload.iat * 1000)
			) {
				this.accessToken = this.api.services.tokenHandler.generate({ uid: this.user.id });
				const minIssuance = this.api.services.tokenHandler.decode(this.accessToken).iat * 1000;
				set = set || {};
				set[`accessTokens.${this.loginType}`] = {
					token: this.accessToken,
					minIssuance: minIssuance
				};
			}

			if (set) {
				await this.request.data.users.applyOpById(this.user.id, { $set: set });
			}
		}
		catch (error) {
			if (!force) {
				// if token seems invalid, try again but force a new token to be created
				this.generateAccessToken(true);
			}
			else {
				const message = typeof error === 'object' ? error.message : error;
				throw this.request.errorHandler.error('token', { reason: message });
			}
		}
	}
	
	// update the time the user last logged in, except if logging in via the web app
	async updateLastLogin () {
		const origin = this.request.request.headers['x-cs-plugin-ide'];
		if (origin === 'webclient') {
			return;
		}
		const op = {
			$set: {
				lastLogin: Date.now()
			}
		};
		if (origin) {
			op.$set.lastOrigin = origin;
			const originDetail = this.request.request.headers['x-cs-plugin-ide-detail'];
			if (originDetail) {
				op.$set.lastOriginDetail = originDetail;
			}
		}
		if (this.trueLogin) {
			op.$set.firstSessionStartedAt = this.user.get('firstSessionStartedAt') === undefined ? Date.now() : 0;
		}
		if (this.countryCode) {
			op.$set.countryCode = this.countryCode;
		}
		await this.request.data.users.applyOpById(this.user.id, op);
	}

	// get the third-party issue providers that are available for issue codemark integration
	// this fetches the "standard" in-cloud providers, we'll add to this for providers for each individual team
	getThirdPartyProviders () {
		const info = new ProviderFetcher({
			request: this.request,
			teams: this.initialDataFetcher.teams
		}).getThirdPartyProviders();
		(this.initialDataFetcher.teams || []).forEach(team => {
			const responseTeam = this.initialDataFetcher.initialData.teams.find(t => t.id === team.id);
			if (responseTeam) {
				responseTeam.providerHosts = info.providerHosts[responseTeam.id];
			}
		});
	}

	// form the response to the request
	async formResponse () {
		if (this.notTrueLogin) {
			return;
		}

		const { isOnPrem, runTimeEnvironment, isProductionCloud } = this.apiConfig.sharedGeneral;

		this.responseData = {
			user: this.user.getSanitizedObjectForMe({ request: this.request }),	// include me-only attributes
			accessToken: this.accessToken,	// access token to supply in future requests
			broadcasterToken: this.broadcasterToken, // more generic "broadcaster" token, for broadcaster solutions other than PubNub
			capabilities: { ...APICapabilities }, // capabilities served by this API server
			features: {
				slack: {
					interactiveComponentsEnabled: this.api.config.integrations.slack.interactiveComponentsEnabled
				}
			},
			isOnPrem,
			isProductionCloud,
			runtimeEnvironment: runTimeEnvironment
		};
		if (this.apiConfig.broadcastEngine.pubnub && this.apiConfig.broadcastEngine.pubnub.subscribeKey) {
			this.responseData.pubnubKey = this.apiConfig.broadcastEngine.pubnub.subscribeKey;	// give them the subscribe key for pubnub
			this.responseData.pubnubToken = this.pubnubToken;	// token used to subscribe to PubNub channels
		}

		// handle capabilities
		if (this.apiConfig.email.suppressEmails) {
			// remove capability for outbound email support if suppressEmails is set in configuration
			delete this.responseData.capabilities.emailSupport;
		}
		
		// if on-prem, remove any capabilities marked as cloud only
		if (isOnPrem) {
			Object.keys(this.responseData.capabilities).forEach(key => {
				const capability = this.responseData.capabilities[key];
				if (capability.cloudOnly) {
					delete this.responseData.capabilities[key];
				}
			});
		}

		// if using socketcluster for messaging (for on-prem installations), return host info
		if (this.apiConfig.broadcastEngine.selected === 'codestreamBroadcaster') {
			const { host, port, ignoreHttps } = this.apiConfig.broadcastEngine.codestreamBroadcaster;
			this.responseData.socketCluster = { host, port, ignoreHttps };
		}
		Object.assign(this.responseData, this.initialData);
	}

	// grant the user permission to subscribe to various broadcaster channels
	async grantSubscriptionPermissions () {
		try {
			await new UserSubscriptionGranter({
				api: this.api,
				data: this.request.data,
				user: this.user,
				request: this.request
			}).grantAll();
		}
		catch (error) {
			throw this.request.errorHandler.error('userMessagingGrant', { reason: error });
		}
	}
}

module.exports = LoginHelper;