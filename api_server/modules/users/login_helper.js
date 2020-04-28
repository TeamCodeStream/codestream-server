// provides a set of common routines for logging a user in

'use strict';

const InitialDataFetcher = require('./initial_data_fetcher');
const UserSubscriptionGranter = require('./user_subscription_granter');
const UUID = require('uuid/v4');
const ProviderFetcher = require(process.env.CS_API_TOP + '/modules/providers/provider_fetcher');
const APICapabilities = require(process.env.CS_API_TOP + '/etc/capabilities');
const SlackCfg = require(process.env.CS_API_TOP + '/config/slack');
const VersionErrors = require(process.env.CS_API_TOP + '/modules/versioner/errors');

class LoginHelper {

	constructor (options) {
		Object.assign(this, options);
		this.loginType = this.loginType || 'web';
		this.request.errorHandler.add(VersionErrors);
	}

	// perform a true login for the user, including returning full response data
	async login () {
		if (this.user.get('inMaintenanceMode')) {
			throw this.request.errorHandler.error('inMaintenanceMode');
		}
		await this.getInitialData();
		await this.generateAccessToken();
		await this.updateLastLogin();
		this.getThirdPartyProviders();
		await this.formResponse();
		await this.grantSubscriptionPermissions();
		return this.responseData;
	}

	// prepare for the user being allowed to login, without actually generating the
	// response data needed for a true login
	async allowLogin () {
		await this.generateAccessToken();
		await this.grantSubscriptionPermissions();
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
				this.request.api.services.tokenHandler.verify(this.accessToken) : 
				null;
			if (
				force ||
				!minIssuance ||
				minIssuance > (tokenPayload.iat * 1000)
			) {
				this.accessToken = this.request.api.services.tokenHandler.generate({ uid: this.user.id });
				const minIssuance = this.request.api.services.tokenHandler.decode(this.accessToken).iat * 1000;
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
		}
		if (this.trueLogin) {
			op.$set.firstSessionStartedAt = this.user.get('firstSessionStartedAt') === undefined ? Date.now() : 0;
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
		this.responseData = {
			user: this.user.getSanitizedObjectForMe({ request: this.request }),	// include me-only attributes
			accessToken: this.accessToken,	// access token to supply in future requests
			pubnubKey: this.request.api.config.pubnub.subscribeKey,	// give them the subscribe key for pubnub
			pubnubToken: this.pubnubToken,	// token used to subscribe to PubNub channels
			broadcasterToken: this.broadcasterToken, // more generic "broadcaster" token, for broadcaster solutions other than PubNub
			capabilities: { ...APICapabilities }, // capabilities served by this API server
			features: {
				slack: {
					interactiveComponentsEnabled: SlackCfg.interactiveComponentsEnabled
				}
			},
			runTimeEnvironment: this.request.api.config.api.runTimeEnvironment
		};
		if (this.request.api.config.email.suppressEmails) {
			delete this.responseData.capabilities.emailSupport;
		}
		
		// if using socketcluster for messaging (for on-prem installations), return host info
		const { socketCluster } = this.request.api.config; 
		if (socketCluster && socketCluster.host && socketCluster.port) {
			this.responseData.socketCluster = {
				host: socketCluster.host,
				port: socketCluster.port,
				ignoreHttps: socketCluster.ignoreHttps
			};
		}
		Object.assign(this.responseData, this.initialData);
	}

	// grant the user permission to subscribe to various broadcaster channels
	async grantSubscriptionPermissions () {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		try {
			await new UserSubscriptionGranter({
				data: this.request.data,
				broadcaster: this.request.api.services.broadcaster,
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