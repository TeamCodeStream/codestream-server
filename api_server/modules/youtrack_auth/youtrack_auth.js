// provide service to handle YouTrack credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'youtrack',
	host: 'colincodestream.myjetbrains.com/youtrack',
	apiHost: 'colincodestream.myjetbrains.com/youtrack/api/rest',
	authPath: 'api/rest/oauth2/auth',
	scopes: 'YouTrack',
	additionalAuthCodeParameters: {
		request_credentials: 'default',
		response_type: 'token'
	},
	noExchange: true,
	tokenFromFragment: 'access_token',
	hasIssues: true
};

class YouTrackAuth extends OAuth2Module {

	constructor (config) {
		super(config);
		this.oauthConfig = OAUTH_CONFIG;
	}

	/*
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
	*/
}

module.exports = YouTrackAuth;
