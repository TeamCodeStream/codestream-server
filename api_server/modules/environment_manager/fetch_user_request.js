// handle the "GET /xenv/fetch-user" request, to fetch a given user via email, for internal use
// between environments

'use strict';

const XEnvRequest = require('./xenv_request');

class FetchUserRequest extends XEnvRequest {

	// process the request...
	async process () {
		await this.requireAndAllow();

		const { id } = this.request.query;
		const user = await this.data.users.getById(id);
		if (user) {
			this.responseData = { user: user.attributes };
		} else if (id) {
			// when providing ID, this provokes an error
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
	}

	// require certain parameters, and discard unknown parameters
	async requireAndAllow () {
		// under one-user-per-org, only fetch by id is supported
		await this.requireAllowParameters('query', {
			required: {
				string: ['id']
			}
		});
	}
}

module.exports = FetchUserRequest;
