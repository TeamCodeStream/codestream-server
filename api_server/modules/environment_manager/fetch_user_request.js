// handle the "GET /xenv/fetch-user" request, to fetch a given user via email, for internal use
// between environments

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules//users/indexes');

class FetchUserRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAndAllow();

		const user = await this.data.users.getOneByQuery(
			{
				searchableEmail: decodeURIComponent(this.request.query.email).toLowerCase()
			},
			{
				hint: UserIndexes.bySearchableEmail
			}
		);
		if (user) {
			this.responseData = { 
				user: {
					...user.getSanitizedObject(this),
					passwordHash: user.get('passwordHash')
				}
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
