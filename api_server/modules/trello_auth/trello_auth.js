// provide service to handle trello credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const FS = require('fs');

class TrelloAuth extends APIServerModule {

	services () {
		return async () => {
			return { trelloAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, state, redirectUri } = options;
		const { apiKey } = request.api.config.trello;
		const parameters = {
			expiration: 'never',
			name: 'CodeStream',
			scope: 'read,write',
			response_type: 'token',
			key: apiKey,
			callback_method: 'fragment',
			return_url: `${redirectUri}?state=${state}`
		};
		const url = 'https://trello.com/1/authorize';
		return { parameters, url };
	}

	// perform pre-processing of data from the token callback, as needed
	async preProcessTokenCallback (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { request, provider, state, mockToken } = options;
		const { response } = request;
		const { authOrigin } = request.api.config.api;
		const { apiKey } = request.api.config.trello;
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

	// get html to display once auth is complete
	getAfterAuthHtml () {
		return this.afterAuthHtml;
	}

	// initialize the module
	initialize () {
		// read in the after-auth html to display once auth is complete
		this.afterAuthHtml = FS.readFileSync(this.path + '/afterAuth.html', { encoding: 'utf8' });
	}
}

module.exports = TrelloAuth;
