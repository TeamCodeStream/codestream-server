// handle the "GET /xenv/fetch-user" request, to fetch a given user via email, for internal use
// between environments

'use strict';

const XEnvRequest = require('./xenv_request');
const UserIndexes = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules//users/indexes');

class FetchUserRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAndAllow();

		const { email, id } = this.request.query;
		if (!email && !id) {
			throw this.errorHandler.error('parameterRequired', { info: 'email or id' });
		}

		let user;
		if (id) {
			user = await this.data.users.getById(id);
		} else {
			user = await this.data.users.getOneByQuery(
				{
					searchableEmail: decodeURIComponent(email).toLowerCase()
				},
				{
					hint: UserIndexes.bySearchableEmail
				}
			);
		}
		if (user) {
			this.responseData = { user: user.attributes };
		} else if (id) {
			// when providing ID, this provokes an error
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		await this.requireAllowParameters('query', {
			optional: {
				string: ['email', 'id']
			}
		});
	}
}

module.exports = FetchUserRequest;
