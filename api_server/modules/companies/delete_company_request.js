// handle the DELETE /companies/:id request to delete (deactivate) a company

'use strict';

const DeleteRequest = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/lib/util/restful/delete_request');
const TeamDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/teams/team_deleter');
const UserDeleter = require(process.env.CSSVC_BACKEND_ROOT + '/api_server/modules/users/user_deleter');

class DeleteCompanyRequest extends DeleteRequest {

	// authorize the request for the current user
	async authorize () {
		// if secret passed, anyone can delete this team
		if (this.request.headers['x-delete-company-secret'] === this.api.config.sharedSecrets.confirmationCheat) {
			return;
		}

		// get the company to delete
		this.companyToDelete = await this.data.companies.getById(this.request.params.id.toLowerCase());
		if (!this.companyToDelete) {
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
		await this.deleteEveryoneTeam();
		await this.deleteWouldBeTeamlessUsers();
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
					(user.teamIds || []).length === 1 &&
					user.teamIds[0] === this.everyoneTeam.id
				);
			});

		if (usersToDelete.length === 0) {
			return;
		}

		const userDeleter = new UserDeleter({
			request: this
		});

		return Promise.all(usersToDelete.map(userToDelete => {
			return userDeleter.deleteModel(userToDelete.id);
		}));
	}
}

module.exports = DeleteCompanyRequest;
