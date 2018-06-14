// provides a set of common routines for logging a user in

'use strict';

const InitialDataFetcher = require('./initial_data_fetcher');
const UserSubscriptionGranter = require('./user_subscription_granter');

class LoginHelper {

    constructor (options) {
        Object.assign(this, options);
    }

    async login () {
        await this.getInitialData();
        await this.grantSubscriptionPermissions();
        await this.generateToken();
        await this.formResponse();
        return this.responseData;
    }

    // get the initial data to return in the response, this is a time-saver for the client
	// so it doesn't have to fetch this data with separate requests
	async getInitialData () {
		this.initialData = await new InitialDataFetcher({
            request: this.request,
            user: this.user
		}).fetchInitialData();
	}

	// grant the user permission to subscribe to various messager channels
	async grantSubscriptionPermissions () {
		// note - it is tough to determine whether this should go before or after the response ... with users in a lot
		// of streams, there could be a performance hit here, but do we want to take a performance hit or do we want
		// to risk the client subscribing to channels for which they don't yet have permissions? i've opted for the
		// performance hit, and i suspect it won't ever be a problem, but be aware...
		try {
			await new UserSubscriptionGranter({
				data: this.request.data,
				messager: this.request.api.services.messager,
				user: this.user,
				request: this.request
			}).grantAll();
		}
		catch (error) {
			throw this.request.errorHandler.error('userMessagingGrant', { reason: error });
		}
	}

	// generate an access token for this login if needed
	async generateToken () {
		// look for a new-style token (with min issuance), if it doesn't exist, or our current token
        // was issued before the min issuance, then we need to generate a new token for this login type
        try {
            const currentTokenInfo = this.user.getTokenInfoByType(this.loginType);
            const minIssuance = typeof currentTokenInfo === 'object' ? (currentTokenInfo.minIssuance || null) : null;
            this.accessToken = typeof currentTokenInfo === 'object' ? currentTokenInfo.token : this.user.get('accessToken');
            const tokenPayload = this.accessToken ? this.request.api.services.tokenHandler.verify(this.accessToken) : null;
            if (
                !minIssuance ||
                minIssuance > (tokenPayload.iat * 1000)
            ) {
                this.accessToken = this.request.api.services.tokenHandler.generate({ uid: this.user.id });
                const minIssuance = this.request.api.services.tokenHandler.decode(this.accessToken).iat;
                await this.request.data.users.applyOpById(
                    this.user.id,
                    {
                        $set: {
                            [`accessTokens.${this.loginType}`]: {
                                token: this.accessToken,
                                minIssuance: minIssuance
                            } 
                        }
                    }
                );
            }
        }
		catch (error) {
			const message = typeof error === 'object' ? error.message : error;
			throw this.errorHandler.error('token', { reason: message });
		}
    }
    
	// form the response to the request
	async formResponse () {
		this.responseData = {
			user: this.user.getSanitizedObjectForMe(),	// include me-only attributes
			accessToken: this.accessToken,	// access token to supply in future requests
			pubnubKey: this.request.api.config.pubnub.subscribeKey	// give them the subscribe key for pubnub
		};
		Object.assign(this.responseData, this.initialData);
	}
}

module.exports = LoginHelper;