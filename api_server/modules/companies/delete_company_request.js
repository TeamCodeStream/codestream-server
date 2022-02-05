// handle the DELETE /companies/:id request to delete (deactivate) a company

'use strict';

const ModelSaver = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/model_saver');
const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const TeamDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_deleter');
const TeamSubscriptionGranter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_subscription_granter');
const UserDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_deleter');
const { awaitParallel } = require(process.env.CSSVC_BACKEND_ROOT + '/shared/server_utils/await_utils');

class DeleteCompanyRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// if secret passed, anyone can delete this team
		if (this.request.headers['x-delete-company-secret'] === this.api.config.sharedSecrets.confirmationCheat) {
			return;
		}

		// get the company to delete
		this.companyToDelete = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.companyToDelete || this.companyToDelete.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'company' });
		}

		const everyoneTeamId = this.companyToDelete.get('everyoneTeamId');
		if (!everyoneTeamId) {
			throw this.errorHandler.error('deleteAuth', { reason: 'cannot delete company that has no "everyone" team' });
		}

		this.everyoneTeam = await this.data.teams.getById(everyoneTeamId);
		if (!this.everyoneTeam || this.everyoneTeam.get('deactivated')) {
			throw this.errorHandler.error('notFound', { info: 'everyone team' }); // shouldn't really happen
		}

		if (!(this.everyoneTeam.get('adminIds') || []).includes(this.request.user.id)) {
			throw this.errorHandler.error('deleteAuth', { reason: 'only admins can delete this company' });
		}
	}

	async process () {
		super.process();
		this.transforms.deletedTeam = await this.deleteEveryoneTeam();
		this.transforms.deletedUsers = await this.deleteWouldBeTeamlessUsers();
		this.transforms.removedUsers = await this.removeUsersFromEveryoneTeam();
	}

	async postProcess () {
		await awaitParallel([
			this.revokeUserMessagingPermissions,
			this.publishRemovalToUsers
		], this);
	}

	// when the company is deleted, we also want to delete the "everyone" team
	async deleteEveryoneTeam () {
		const teamDeleter = new TeamDeleter({
			request: this
		});

		return teamDeleter.deleteModel(this.everyoneTeam.id);
	}

	// when the company is deleted, we also want to delete users with no other team
	async deleteWouldBeTeamlessUsers () {
		const teamUsers = await this.data.users.getByIds(this.everyoneTeam.get('memberIds') || []);
		const usersToDelete = teamUsers
			.filter(user => {
				return (
					!user.get('deactivated') &&
					(user.get('teamIds') || []).length === 1 &&
					user.get('teamIds')[0] === this.everyoneTeam.id
				);
			});

		if (usersToDelete.length === 0) {
			return;
		}

		const userDeleter = new UserDeleter({
			request: this
		});

		return Promise.all(usersToDelete.map(async userToDelete => {
			return await userDeleter.deleteModel(userToDelete.id);
		}));
	}

	// when the company is deleted, we want to remove the users from the team
	async removeUsersFromEveryoneTeam () {
		const usersToRemove = await this.data.users.getByIds(this.everyoneTeam.get('memberIds') || []);

		if (usersToRemove.length === 0) {
			return;
		}

		return Promise.all(usersToRemove.map(async user => {
			return await this.removeUserFromTeam(user, this.everyoneTeam.id, this.companyToDelete.id);
		}));
	}

	async removeUserFromTeam (user, teamId, companyId) {
		const op = {
			$pull: {
				teamIds: teamId,
				companyIds: companyId
			},
			$set: {
				modifiedAt: Date.now()
			}
		};

		return await new ModelSaver({
			request: this,
			collection: this.data.users,
			id: user.id
		}).save(op);
	}

	// revoke permissions to the users removed from the team to subscribe to the team channel
	async revokeUserMessagingPermissions () {
		if (!this.transforms.removedUsers || this.transforms.removedUsers.length === 0) {
			return;
		}
		const usersToRevoke = await this.data.users.getByIds(this.transforms.removedUsers.map(userUpdate => userUpdate.id));

		const granterOptions = {
			data: this.data,
			broadcaster: this.api.services.broadcaster,
			team: this.everyoneTeam,
			members: usersToRevoke,
			request: this,
			revoke: true
		};

		try {
			await new TeamSubscriptionGranter(granterOptions).grantToMembers();
		}
		catch (error) {
			throw this.errorHandler.error('teamMessagingGrant', { reason: error });
		}
	}

	// publish the removal to the broadcaster channel for any users that have been removed from the team
	async publishRemovalToUsers () {
		if (!this.transforms.removedUsers) {
			return;
		}

		await Promise.all(this.transforms.removedUsers.map(async userUpdate => {
			await this.publishRemovalToUser(userUpdate);
		}));
	}

	// publish the removal to the broadcaster channel for any user that has been removed from the team
	async publishRemovalToUser (userUpdate) {
		const channel = 'user-' + userUpdate.id;
		const message = Object.assign({}, { user: userUpdate }, { requestId: this.request.id });
		try {
			await this.api.services.broadcaster.publish(
				message,
				channel,
				{ request: this }
			);
		}
		catch (error) {
			// this doesn't break the chain, but it is unfortunate...
			this.warn(`Could not publish team removal message to user ${userUpdate.id}: ${JSON.stringify(error)}`);
		}
	}
}

module.exports = DeleteCompanyRequest;
