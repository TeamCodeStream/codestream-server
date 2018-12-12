// handle the "POST /no-auth/provider-auth" request to initiate user auth through a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');
const Errors = require('./errors');
class ProviderAuthRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(Errors);
	}

	async authorize () {
		// no authorization necessary, this just initiates a redirect to a third-party auth
		// connecting the current user
	}

	// process the request...
	async process () {
		await this.requireAndAllow();		// require certain parameters, discard unknown parameters
		await this.performRedirect();	// perform whatever redirect is necessary to initiate the authorization
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['code']
				},
				optional: {
					string: ['key', 'expiresIn']
				}
			}
		);
	}

	async performRedirect () {
		this.provider = this.request.params.provider.toLowerCase();
		switch (this.provider) {
		case 'trello':
			return await this.trelloRedirect();
		case 'github':
			return await this.githubRedirect();
		case 'asana':
			return await this.asanaRedirect();
		default: 
			throw this.errorHandler.error('unknownProvider', { info: this.provider });
		}

	}

	// perform redirect for trello auth
	async trelloRedirect () {
		if (!this.api.services.trelloAuth) {
			return;
		}
		const options = {
			key: this.request.query.key,
			state: this.request.query.code,
			provider: this.provider,
			request: this
		};
		await this.api.services.trelloAuth.handleAuthRedirect(options); 
	}

	// perform redirect for github auth
	async githubRedirect () {
		if (!this.api.services.githubAuth) {
			return;
		}
		const options = {
			state: this.request.query.code,
			provider: this.provider,
			request: this
		};
		await this.api.services.githubAuth.handleAuthRedirect(options);
	}

	// perform redirect for asana auth
	async asanaRedirect () {
		if (!this.api.services.asanaAuth) {
			return;
		}
		const options = {
			state: this.request.query.code,
			provider: this.provider,
			request: this
		};
		await this.api.services.asanaAuth.handleAuthRedirect(options);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-auth',
			summary: 'Initiates authorization with a third-party provider',
			access: 'No authorization needed, this is essentially just a redirect to the third-party auth process',
			description: 'Provide the appropriate redirect response to initiate authorization against the given third-party provider',
			input: 'Specify the provider in the path',
			returns: 'Redirects to the appropriate authorization page for the provider in question'
		};
	}
}

module.exports = ProviderAuthRequest;
