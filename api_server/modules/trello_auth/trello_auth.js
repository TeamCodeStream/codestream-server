// provide service to handle trello credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'trello',
	host: 'trello.com',
	apiHost: 'api.trello.com/1',
	authPath: '1/authorize',
	scopes: 'read,write',
	additionalAuthCodeParameters: {
		expiration: 'never',
		name: 'CodeStream',
		response_type: 'token',
		callback_method: 'fragment'
	},
	noExchange: true,
	tokenFromFragment: 'token',
	additionalTokenValues: ['apiKey'],
	hasIssues: true
};

class TrelloAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	// get redirect parameters and url to use in the redirect response
	// here we override the usual method to deal with some trello peculiarities
	getRedirectData (options) {
		const data = super.getRedirectData(options);
		const { state, redirectUri } = options;
		data.parameters.return_url = `${redirectUri}?state=${state}`;
		delete data.parameters.redirect_uri;
		const { apiKey } = this.api.config.trello;
		data.parameters.key = apiKey;
		delete data.parameters.client_id;
		delete data.parameters.state;
		return data;
	}
}

module.exports = TrelloAuth;
