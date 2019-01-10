// provide service to handle trello credential authorization

'use strict';

const OAuth2Module = require(process.env.CS_API_TOP + '/lib/oauth2/oauth2_module.js');

const OAUTH_CONFIG = {
	provider: 'trello',
	authUrl: 'https://trello.com/1/authorize',
	scopes: 'read,write',
	additionalAuthCodeParameters: {
		expiration: 'never',
		name: 'CodeStream',
		response_type: 'token',
		callback_method: 'fragment'
	},
	noExchange: true
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

	// perform pre-processing of data from the token callback, as needed
	async preProcessTokenCallback (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { request, provider, state, mockToken } = options;
		const { response } = request;
		const { authOrigin } = this.api.config.api;
		const { apiKey } = this.api.config.trello;
		if (mockToken) {
			return { accessToken: mockToken, apiKey };
		}
		else if (request.request.query.token) {
			// already have the token, so good to go 
			return { accessToken: request.request.query.token, apiKey };
		}
		response.type('text/html');
		response.send(`
<script>
	var hash = window.location.hash.substr(1);
	var hashObject = hash.split('&').reduce(function (result, item) {
		var parts = item.split('=');
		result[parts[0]] = parts[1];
		return result;
	}, {});
	const token = hashObject.token || '';
	document.location.href = "${authOrigin}/provider-token/${provider}?state=${state}&token=" + token;
</script>
`
		);
		request.responseHandled = true;
		return false;	// indicates to stop further processing
	}
}

module.exports = TrelloAuth;
