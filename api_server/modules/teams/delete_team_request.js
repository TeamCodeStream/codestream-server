// handle the DELETE /teams/:id request to delete (deactivate) a team

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');

class DeleteTeamRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// currently can only be done if a secret is provided
		if (this.request.headers['x-delete-team-secret'] !== this.api.config.sharedSecrets.confirmationCheat) {
			throw this.errorHandler.error('deleteAuth');
		}
	}

	// TODO - flesh this out for team publishing, remove users from team, and describe
}

module.exports = DeleteTeamRequest;
