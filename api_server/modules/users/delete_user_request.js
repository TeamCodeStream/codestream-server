// handle the DELETE /users/:id request to delete (deactivate) a user

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const UserPublisher = require('./user_publisher');

class DeleteUserRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// if secret passed, anyone can delete this user
		if (this.request.headers['x-delete-user-secret'] === this.api.config.sharedSecrets.confirmationCheat) {
			return;
		}

		// get the user to delete
		this.userToDelete = await this.data.users.getById(this.request.params.id.toLowerCase());
		if (!this.userToDelete) {
			throw this.errorHandler.error('notFound', { info: 'user' });
		}

		// i can always delete myself
		if (this.userToDelete.id === this.user.id) {
			return;
		}
		
		// find common teams between the user to delete, and the user doing the deletion
		// only if the user doing the deletion is an admin on one of their common teams, can the user be deleted
		const userTeams = await this.data.teams.getByIds(this.user.get('teamIds') || []);
		const commonAdminTeams = userTeams.filter(team => {
			return (
				(this.userToDelete.get('teamIds') || []).includes(team.id) &&
				(team.get('adminIds') || []).includes(this.user.id)
			);
		});
		if (commonAdminTeams.length === 0) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only the user or an admin can delete a user' });
		}
	}

	async handleResponse () {
		if (this.gotError) {
			return super.handleResponse();
		}
		delete this.responseData.user.$set.searchableEmail; // this is a server-only attribute
		return super.handleResponse();
	}

	// after the user is updated...
	async postProcess () {
		// publish the user to the appropriate broadcaster channel(s)
		await new UserPublisher({
			user: this.user,
			data: this.responseData.user,
			request: this,
			broadcaster: this.api.services.broadcaster
		}).publishUserToTeams();
	}

	// describe this route for help
	static describe (module) {
		const description = DeleteRequest.describe(module);
		description.access = 'Must be the an admin on one of the teams the user to be deleted is on';
		description.returns = {
			summary: 'Returns the user with a directive to set deactivated flag to true',
			looksLike: {
				post: {
					id: '<ID of the user>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.publishes = {
			summary: 'Publishes a user directive, instructing to set the deactivated flag, to the team channel for all the teams the user is on.',
			looksLike: {
				post: {
					id: '<ID of the user>',
					$set: {
						deactivated: true
					}
				}
			}
		};
		description.errors.push('alreadyDeleted');
		return description;
	}
}

module.exports = DeleteUserRequest;
