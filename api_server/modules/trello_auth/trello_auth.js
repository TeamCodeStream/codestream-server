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

	async handleAuthRedirect (options) {
		const { provider, state, request } = options;
		const { config } = request.api;
		const { authOrigin } = config.api;
		const { apiKey } = config.trello;
		const { response } = request;
		const parameters = {
			expiration: 'never',
			name: 'CodeStream',
			scope: 'read,write',
			response_type: 'token',
			key: apiKey,
			callback_method: 'fragment',
			return_url: `${authOrigin}/provider-token/${provider}?state=${state}`
		};
		const query = Object.keys(parameters)
			.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
			.join('&');
		response.redirect(`https://trello.com/1/authorize?${query}`);
		request.responseHandled = true;
	}

	async preProcessTokenCallback (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { request, provider, state } = options;
		const { response } = request;
		const { authOrigin } = options.request.api.config.api;
		if (request.request.query.token) {
			// already have the token, so good to go 
			return true;
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

	getAfterAuthHtml () {
		return this.afterAuthHtml;
	}

	initialize () {
		this.afterAuthHtml = FS.readFileSync(this.path + '/afterAuth.html', { encoding: 'utf8' });
	}
}

module.exports = TrelloAuth;
