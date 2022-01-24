// handle the "GET /no-auth/fetch-user" request, to fetch a given user via email, for internal use
// between environments

'use strict';

const RestfulRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/restful_request');
const Indexes = require('./indexes');
const AuthErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/authenticator/errors');

class FetchUserRequest extends RestfulRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(AuthErrors);
	}

	// authorize the client to make this request
	async authorize () {
		// we rely on a secret, known only to our servers
		if (this.request.headers['x-cs-auth-secret'] !== this.api.config.sharedSecrets.auth) {
			this.response.status(401);
			throw this.errorHandler.error('missingAuthorization');
		}
	}

	// process the request...
	async process () {
		await this.requireAndAllow();

		const user = await this.data.users.getOneByQuery(
			{
				searchableEmail: decodeURIComponent(this.request.query.email).toLowerCase()
			},
			{
				hint: Indexes.bySearchableEmail
			}
		);
		if (user) {
			this.responseData = { 
				user: user.getSanitizedObject(this)
			};
		}
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('query', {
			required: {
				string: ['email'],
			},
		});
	}
}

module.exports = FetchUserRequest;
