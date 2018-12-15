// handle the "POST /provider-auth-code" request to obtain an auth-code to initiate 
// auth with a third-party provider

'use strict';

const RestfulRequest = require(process.env.CS_API_TOP + '/lib/util/restful/restful_request.js');

class ProviderAuthCodeRequest extends RestfulRequest {

	async authorize () {
		// user must be a member of the team
		this.teamId = this.request.query.teamId;
		if (!this.teamId) {
			throw this.errorHandler.error('parameterRequired', { info: 'teamId' });
		}
		this.teamId = this.teamId.toLowerCase();
		if (!this.user.hasTeam(this.teamId)) {
			throw this.errorHandler.error('readAuth', { reason: 'user must be a member of the team' });
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();	// require certain parameters, discard unknown parameters
		await this.generateCode();		// generate the auth code
	}

	// require certain parameters, discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters(
			'query',
			{
				required: {
					string: ['teamId']
				},
				optional: {
					string: ['expiresIn']
				}
			}
		);
	}

	// generate the code 
	async generateCode () {
		const state = {
			userId: this.request.user.id,
			teamId: this.request.query.teamId
		};
		const stateToken = await this.generateStateToken(state);
		this.responseData = {
			code: stateToken
		};
	}

	// generate a state token based on the passed payload
	async generateStateToken (payload) {
		// time till expiration can be provided (normally for testing purposes),
		// or default to configuration
		let expiresIn = 10 * 60 * 1000;
		const requestExpiresIn = this.request.query.expiresIn ? parseInt(this.request.query.expiresIn, 10) : null;
		if (requestExpiresIn && requestExpiresIn < expiresIn) {
			this.warn('Overriding configured provider auth token expiration to ' + requestExpiresIn);
			expiresIn = requestExpiresIn;
		}
		const expiresAt = Date.now() + expiresIn;
		return this.api.services.tokenHandler.generate(
			payload,
			'pauth',
			{ expiresAt }
		);
	}

	// describe this route for help
	static describe () {
		return {
			tag: 'provider-auth-code',
			summary: 'Returns an authorization code which can be used to make the provider-auth call to connect with a third-party provider',
			access: 'No access control, user is authorized per their access token',
			description: 'Returns an authorization code which can be used to make the provider-auth call to connect with a third-party provider',
			input: {
				summary: 'Specify teamId in the query',
				looksLike: '?teamId=<teamId>'
			},
			returns: {
				summary: 'Returns a code to be used in the provider-auth call',
				looksLike: {
					code: '<auth code>'
				}
			}
		};
	}
}

module.exports = ProviderAuthCodeRequest;
