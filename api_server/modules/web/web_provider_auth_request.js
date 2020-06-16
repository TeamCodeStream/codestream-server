'use strict';

const APIRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/api_server/api_request.js');
const WebErrors = require('./errors');
const ProviderErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/providers/errors');
const ErrorHandler = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/error_handler');

class WebProviderAuthRequest extends APIRequest {

	constructor (options) {
		super(options);
		this.errorHandler = new ErrorHandler(ProviderErrors);
	}

	async authorize () {
	}

	async process () {
		this.provider = this.request.params.provider.toLowerCase();
		this.serviceAuth = this.api.services[`${this.provider}Auth`];
		if (!this.serviceAuth) {
			this.warn(`Auth service ${this.provider} is not available`);
			this.redirectLogin(WebErrors.internalError.code);
			return;
		}

		let expiresIn = 2 * 60 * 1000;
		const passedExpiresIn = parseInt(this.request.query.expiresIn || '', 10);
		if (passedExpiresIn && passedExpiresIn < expiresIn) {
			expiresIn = passedExpiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		const payload = {
			userId: 'anon',
			url: `${this.api.config.api.publicApiUrl}/web/provider-auth-complete/${this.provider}`
		};
		const payloadMappings = {
			teamId: 'teamId',
			url: 'url',
			signupToken: 'st',
			access: 'access',
			inviteCode: 'ic',
			noSignup: 'nosu',
			tenantId: 'tid',
			hostUrl: 'hu'
		};
		Object.keys(payloadMappings).forEach(mapping => {
			if (this.request.query[mapping]) {
				payload[payloadMappings[mapping]] = decodeURIComponent(this.request.query[mapping]);
			}
		});

		const code = this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);
		this.response.cookie(`t-${this.provider}`, code, {
			secure: true,
			signed: true
		});

		// set up options for initiating a redirect 
		const { authOrigin, callbackEnvironment } = this.api.config.api;
		let state = `${callbackEnvironment}!${code}`;
		const redirectUri = `${authOrigin}/provider-token/${this.provider}`;
		const options = {
			state,
			provider: this.provider,
			request: this,
			redirectUri,
			access: this.request.query.access,
			sharing: !!this.request.query.sharing,
			hostUrl: this.hostUrl || payload.hu
		};
		this.log('redirectUri: ' + redirectUri);

		// test mode to just return the generated state variable
		if (this.request.query._returnState) {
			this.responseData = { state };
			return;
		}

		// get the specific query data to use in the redirect, and respond with the redirect url
		try {
			const { parameters, url } = this.serviceAuth.getRedirectData(options); 
			const query = Object.keys(parameters)
				.map(key => `${key}=${encodeURIComponent(parameters[key])}`)
				.join('&');
			const redirectTo = `${url}?${query}`;
			this.log('Redirect to: ' + redirectTo);
			this.response.redirect(redirectTo);
			this.responseHandled = true;
		}
		catch (error) {
			if (
				this.provider === 'okta' &&
				this.request.query.url &&
				typeof error === 'object' &&
				error.code === 'PRVD-1008'
			) {
				const errorMessage = encodeURIComponent('Host URL required');
				this.response.redirect(`/web/configure-okta?url=${this.request.query.url}&error=${errorMessage}`);
				this.responseHandled = true;
			}
			else {
				this.redirectError(error);
			}
		}
	}

	redirectLogin (error) {
		const url = encodeURIComponent(this.request.query.url);
		this.response.redirect(`/web/login?error=${error}&url=${url}`);
		this.responseHandled = true;
	}

	redirectError (error) {
		const message = error instanceof Error ? error.message : JSON.stringify(error);
		const errorCode = typeof error === 'object' ? error.code : '';
		this.warn('Error handling provider token request: ' + message);
		let url = `/web/error?code=${errorCode}&provider=${this.provider}`;
		this.response.redirect(url);
		this.responseHandled = true;
	}
}

module.exports = WebProviderAuthRequest;
