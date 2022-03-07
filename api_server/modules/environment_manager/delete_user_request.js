// handle the "GET /xenv/delete-user/:id" request, to delete a user from across environments

'use strict';

const XEnvRequest = require('./xenv_request');
const UserErrors = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/errors');

class DeleteUserRequest extends XEnvRequest {

	constructor (options) {
		super(options);
		this.errorHandler.add(UserErrors);
	}

	// process the request...
	async process () {
		const user = await this.data.users.getById(this.request.params.id.toLowerCase());
		if (!user) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}
		if (user.get('deactivated')) {
			throw this.errorHandler.error('alreadyDeleted');
		}

		// users can only be deleted from across environments if they aren't on any teams
		if ((user.get('teamIds') || []).length > 0) {
			throw this.errorHandler.error('deleteAuth', { reason: 'user is on at least one team' });
		}
		
		const now = Date.now();
		const emailParts = user.get('email').split('@');
		const newEmail = `${emailParts[0]}-deactivated${now}@${emailParts[1]}`;
		await this.data.users.updateDirect(
			{ id: this.data.users.objectIdSafe(user.id) },
			{ $set: { deactivated: true, email: newEmail, searchableEmail: newEmail.toLowerCase() } }
		);
	}
}

module.exports = DeleteUserRequest;
