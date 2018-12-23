// provide service to handle gitlab credential authorization

'use strict';

const APIServerModule = require(process.env.CS_API_TOP + '/lib/api_server/api_server_module.js');
const FS = require('fs');

class GitlabAuth extends APIServerModule {

	services () {
		return async () => {
			return { gitlabAuth: this };
		};
	}

	// get redirect parameters and url to use in the redirect response
	getRedirectData (options) {
		const { request, state, redirectUri } = options;
		const { appClientId } = request.api.config.gitlab;
		const parameters = {
			client_id: appClientId,
			redirect_uri: `${redirectUri}?state=${state}`,
			state,
			response_type: 'token'
		};
		const url = 'https://gitlab.com/oauth/authorize';
		return { url, parameters };
	}

	// perform pre-processing of data from the token callback, as needed
	async preProcessTokenCallback (options) {
		// special allowance for token in the fragment, which we can't access,
		// so send a client script that can 
		const { request, provider, state, mockToken } = options;
		const { response } = request;
		const { authOrigin } = request.api.config.api;
		if (mockToken) {
			return { accessToken: mockToken };
		}
		else if (request.request.query.token) {
			// already have the token, so good to go 
			return { accessToken: request.request.query.token };
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
	const token = hashObject.access_token || '';
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

module.exports = GitlabAuth;
